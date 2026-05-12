package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.account.MechanicProfile;
import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.account.VerificationStatus;
import com.pitstop.pitstop_backend.config.WebSocketEventPublisher;
import com.pitstop.pitstop_backend.job.dto.AbandonResponse;
import com.pitstop.pitstop_backend.job.dto.BroadcastJobResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BroadcastService {

    // Ring bands: [minKm, maxKm] for rings 1–4 (index 0–3)
    private static final double[][] RING_BANDS = {
            {0, 2},
            {2, 5},
            {5, 10},
            {10, 20}
    };

    private final JobRepository jobRepository;
    private final JobBroadcastRepository jobBroadcastRepository;
    private final MechanicProfileRepository mechanicProfileRepository;
    @Autowired
    private WebSocketEventPublisher wsPublisher;

    public BroadcastService(
            JobRepository jobRepository,
            JobBroadcastRepository jobBroadcastRepository,
            MechanicProfileRepository mechanicProfileRepository
    ) {
        this.jobRepository = jobRepository;
        this.jobBroadcastRepository = jobBroadcastRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
    }

    // Send job to all eligible mechanics in the current ring band.
    // Called immediately after SOS creation (ring 1) and on ring advancement.
    @Transactional
    public void broadcastToRing(Job job) {
        int ringIndex = job.getBroadcastRing() - 1;
        double[] band = RING_BANDS[ringIndex];

        List<MechanicProfile> mechanics = mechanicProfileRepository.findEligibleMechanicsInRing(
                job.getId(),
                job.getVehicleType().name(),
                job.getLatitude(),
                job.getLongitude(),
                band[0], band[1]
        );

        if (mechanics.isEmpty()) {
            // No mechanics in this ring — let the scheduler handle the 2-min wait.
            // A mechanic coming online mid-wait will be caught by notifyNewlyOnlineMechanic().
            return;
        }

        for (MechanicProfile mp : mechanics) {
            JobBroadcast broadcast = new JobBroadcast();
            broadcast.setJobId(job.getId());
            broadcast.setMechanicProfileId(mp.getId());
            broadcast.setRing(job.getBroadcastRing());
            jobBroadcastRepository.save(broadcast);
            // Push a ping so the mechanic's frontend calls poll() immediately instead of waiting 30s.
            wsPublisher.publishBroadcast(mp.getAccount().getId(), Map.of("type", "NEW_BROADCAST"));
        }
    }

    // Mechanic declines. If all mechanics in the current ring have declined → advance immediately.
    @Transactional
    public void handleDecline(Long jobId, Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));
        Long mechanicProfileId = profile.getId();

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() != JobStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is no longer pending");
        }

        JobBroadcast broadcast = jobBroadcastRepository
                .findByJobIdAndMechanicProfileId(jobId, mechanicProfileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No broadcast found for this job and mechanic"));

        if (broadcast.getStatus() != JobBroadcastStatus.SENT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Broadcast already responded to");
        }

        broadcast.setStatus(JobBroadcastStatus.DECLINED);
        jobBroadcastRepository.save(broadcast);

        long totalInRing = jobBroadcastRepository.countByJobIdAndRing(jobId, job.getBroadcastRing());
        long declinedInRing = jobBroadcastRepository.countByJobIdAndRingAndStatus(
                jobId, job.getBroadcastRing(), JobBroadcastStatus.DECLINED);

        if (totalInRing == declinedInRing) {
            advanceOrTimeout(job);
        }
    }

    // Mechanic accepts. Locks the job, expires all competing broadcasts, takes mechanic offline.
    // @Version on Job causes ObjectOptimisticLockingFailureException if two mechanics accept simultaneously.
    @Transactional
    public void handleAccept(Long jobId, Long accountId) {
        try {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));
        Long mechanicProfileId = profile.getId();

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() != JobStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is no longer available");
        }

        JobBroadcast broadcast = jobBroadcastRepository
                .findByJobIdAndMechanicProfileId(jobId, mechanicProfileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "This job was not broadcast to you"));

        if (broadcast.getStatus() != JobBroadcastStatus.SENT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Broadcast already responded to");
        }

        // Expire all other competing SENT broadcasts for this job
        jobBroadcastRepository.expireAllSentForJobExcept(jobId, mechanicProfileId);

        // Mark this mechanic's broadcast as accepted
        broadcast.setStatus(JobBroadcastStatus.ACCEPTED);
        jobBroadcastRepository.save(broadcast);

        // Accept the job
        job.setStatus(JobStatus.ACCEPTED);
        job.setMechanicProfileId(mechanicProfileId);
        jobRepository.save(job);

        // Snapshot location before clearing — used to restore online state if user cancels
        profile.setLastKnownLatitude(profile.getLatitude());
        profile.setLastKnownLongitude(profile.getLongitude());

        // Take mechanic offline automatically
        profile.setIsAvailable(false);
        profile.setLatitude(null);
        profile.setLongitude(null);
        mechanicProfileRepository.save(profile);

        // Notify both sides — user sees ACCEPTED, mechanic sees their own job card update.
        // afterCommitOrNow inside wsPublisher ensures DB is committed before the WS event fires.
        wsPublisher.publishJobUpdate(job.getAccountId(), accountId,
                java.util.Map.of("type", "JOB_UPDATE"));
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job was just taken by another mechanic");
        }
    }

    // Mechanic abandons active job — resets to PENDING, restarts Ring 1 broadcast immediately
    // (user never waits), restores mechanic online, and returns whether to show the offer screen.
    // Second abandon on the same job triggers a day suspension.
    @Transactional
    public AbandonResponse mechanicAbandon(Long jobId, Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!profile.getId().equals(job.getMechanicProfileId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your job");
        }

        if (job.getStatus() != JobStatus.ACCEPTED &&
                job.getStatus() != JobStatus.ARRIVAL_REQUESTED &&
                job.getStatus() != JobStatus.IN_PROGRESS &&
                job.getStatus() != JobStatus.COMPLETION_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not active");
        }

        // Count prior ACCEPTED broadcasts for this mechanic on this job (detects second abandon)
        long acceptedCount = jobBroadcastRepository.countByJobIdAndMechanicProfileIdAndStatus(
                jobId, profile.getId(), JobBroadcastStatus.ACCEPTED);

        // Expire leftover SENT broadcasts
        jobBroadcastRepository.expireAllSentForJob(jobId);

        // Reset job to PENDING Ring 1 — ready for rebroadcast
        job.setStatus(JobStatus.PENDING);
        job.setMechanicProfileId(null);
        job.setBroadcastRing(1);
        job.setBroadcastStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Restart broadcast from Ring 1 immediately — user is not made to wait
        broadcastToRing(job);

        // Restore mechanic online at their last known location
        profile.setIsAvailable(true);
        profile.setLatitude(profile.getLastKnownLatitude());
        profile.setLongitude(profile.getLastKnownLongitude());

        AbandonResponse response;
        if (acceptedCount >= 2) {
            // Second abandon on same job — permanent block + day suspension
            jobBroadcastRepository.declineAllForMechanicAndJob(jobId, profile.getId());
            profile.setVerificationStatus(VerificationStatus.SUSPENDED);
            profile.setSuspensionEndsAt(LocalDate.now().atTime(23, 59, 59));
            profile.setSuspensionReason("Double abandonment on Job #" + jobId + " — suspended until midnight");
            profile.setMidJobCancels(profile.getMidJobCancels() + 1);
            response = new AbandonResponse(false, job.getId(), job.getProblemType().name(),
                    job.getVehicleType().name(), job.getVehicleName(), job.getArea());
        } else {
            // First abandon — offer the mechanic a chance to take it back
            response = new AbandonResponse(true, job.getId(), job.getProblemType().name(),
                    job.getVehicleType().name(), job.getVehicleName(), job.getArea());
        }

        mechanicProfileRepository.save(profile);

        // Notify user their job went back to PENDING (mechanic abandoned).
        wsPublisher.publishJobUpdate(job.getAccountId(), null,
                java.util.Map.of("type", "JOB_UPDATE"));

        return response;
    }

    // Mechanic takes back a job they just abandoned — only valid if still PENDING.
    @Transactional
    public void mechanicTakeBack(Long jobId, Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() != JobStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job already taken by someone else");
        }

        // Expire SENT broadcasts that went to other mechanics after the abandon rebroadcast
        jobBroadcastRepository.expireAllSentForJobExcept(jobId, profile.getId());

        // New ACCEPTED row — count becomes 2, enabling second-abandon detection
        JobBroadcast takeBackBroadcast = new JobBroadcast();
        takeBackBroadcast.setJobId(jobId);
        takeBackBroadcast.setMechanicProfileId(profile.getId());
        takeBackBroadcast.setRing(job.getBroadcastRing());
        takeBackBroadcast.setStatus(JobBroadcastStatus.ACCEPTED);
        jobBroadcastRepository.save(takeBackBroadcast);

        // Re-assign job
        job.setStatus(JobStatus.ACCEPTED);
        job.setMechanicProfileId(profile.getId());
        jobRepository.save(job);

        // Snapshot current location then take offline (mechanic is back on job)
        profile.setLastKnownLatitude(profile.getLatitude());
        profile.setLastKnownLongitude(profile.getLongitude());
        profile.setIsAvailable(false);
        profile.setLatitude(null);
        profile.setLongitude(null);
        mechanicProfileRepository.save(profile);

        // Notify user their job is ACCEPTED again (mechanic took it back).
        wsPublisher.publishJobUpdate(job.getAccountId(), accountId,
                java.util.Map.of("type", "JOB_UPDATE"));
    }

    // Mechanic declines to take back the abandoned job — permanently blocks it and
    // triggers newly-online notification for other nearby PENDING jobs.
    @Transactional
    public void mechanicMoveOn(Long jobId, Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        // Permanent block — job will never be sent to this mechanic again via any path
        jobBroadcastRepository.declineAllForMechanicAndJob(jobId, profile.getId());

        // Mechanic already online (restored in mechanicAbandon); find any nearby PENDING jobs now
        notifyNewlyOnlineMechanic(profile);
    }

    // Returns all pending broadcasts for a mechanic — used for polling.
    // Returns empty list if mechanic is offline (on job or manually offline).
    public List<BroadcastJobResponse> getPendingBroadcast(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        if (!profile.getIsAvailable()) {
            return List.of();
        }

        return jobBroadcastRepository
                .findByMechanicProfileIdAndStatusOrderBySentAtDesc(profile.getId(), JobBroadcastStatus.SENT)
                .stream()
                .flatMap(broadcast -> jobRepository.findById(broadcast.getJobId())
                        .filter(job -> job.getStatus() == JobStatus.PENDING)
                        .map(job -> {
                            Double distKm  = null;
                            Integer etaMin = null;
                            if (profile.getLatitude() != null && profile.getLongitude() != null) {
                                double d = haversineKm(
                                        profile.getLatitude(), profile.getLongitude(),
                                        job.getLatitude(),     job.getLongitude()
                                );
                                distKm = Math.round(d * 10.0) / 10.0;
                                etaMin = (int) Math.ceil(d / 30.0 * 60.0);
                            }
                            return new BroadcastJobResponse(
                                    broadcast.getId(),
                                    job.getId(),
                                    job.getStatus(),
                                    job.getVehicleType(),
                                    job.getProblemType(),
                                    job.getVehicleName(),
                                    job.getAddress(),
                                    job.getArea(),
                                    job.getBroadcastRing(),
                                    broadcast.getSentAt(),
                                    distKm,
                                    etaMin
                            );
                        })
                        .stream())
                .collect(Collectors.toList());
    }

    // Called when a mechanic toggles online — find any PENDING jobs they're eligible for
    // and haven't yet received a broadcast for, and send them one immediately.
    @Transactional
    public void notifyNewlyOnlineMechanic(MechanicProfile mechanic) {
        List<Job> eligible = jobRepository.findEligiblePendingJobsForMechanic(
                mechanic.getId(),
                mechanic.getLatitude(),
                mechanic.getLongitude(),
                mechanic.getServiceRadiusKm()
        );
        boolean notified = false;
        for (Job job : eligible) {
            JobBroadcast broadcast = new JobBroadcast();
            broadcast.setJobId(job.getId());
            broadcast.setMechanicProfileId(mechanic.getId());
            broadcast.setRing(job.getBroadcastRing());
            jobBroadcastRepository.save(broadcast);
            notified = true;
        }
        if (notified) {
            wsPublisher.publishBroadcast(mechanic.getAccount().getId(), Map.of("type", "NEW_BROADCAST"));
        }
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Advance to the next ring or cancel the job if ring 4 is exhausted.
    // Public so the scheduler can call it through the Spring proxy with its own transaction.
    @Transactional
    public void advanceOrTimeout(Job job) {
        if (job.getBroadcastRing() < 4) {
            job.setBroadcastRing(job.getBroadcastRing() + 1);
            job.setBroadcastStartedAt(LocalDateTime.now());
            jobRepository.save(job);
            broadcastToRing(job);
        } else {
            jobBroadcastRepository.expireAllSentForJob(job.getId());
            CancellationReason reason = (jobBroadcastRepository.countByJobId(job.getId()) == 0)
                    ? CancellationReason.NO_MECHANICS_AVAILABLE
                    : CancellationReason.BROADCAST_EXHAUSTED;
            job.setCancellationReason(reason);
            job.setStatus(JobStatus.CANCELLED);
            jobRepository.save(job);
            // Push cancellation to user immediately — no mechanic was found.
            wsPublisher.publishJobUpdate(job.getAccountId(), null,
                    Map.of("type", "JOB_CANCELLED", "cancellationReason", reason.name()));
        }
    }
}
