package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.account.MechanicProfile;
import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.job.dto.BroadcastJobResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    @Transactional
    public void handleAccept(Long jobId, Long accountId) {
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

        // Take mechanic offline automatically
        profile.setIsAvailable(false);
        profile.setLatitude(null);
        profile.setLongitude(null);
        mechanicProfileRepository.save(profile);
    }

    // Mechanic abandons active job — resets to PENDING and restarts Ring 1 broadcast.
    @Transactional
    public void mechanicAbandon(Long jobId, Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!profile.getId().equals(job.getMechanicProfileId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your job");
        }

        if (job.getStatus() != JobStatus.ACCEPTED && job.getStatus() != JobStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not active");
        }

        // Expire any leftover broadcasts
        jobBroadcastRepository.expireAllSentForJob(jobId);

        // Reset job to PENDING Ring 1 — ready for rebroadcast
        job.setStatus(JobStatus.PENDING);
        job.setMechanicProfileId(null);
        job.setBroadcastRing(1);
        job.setBroadcastStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Restart broadcast from Ring 1
        broadcastToRing(job);
    }

    // Returns the pending broadcast for a mechanic — used for dashboard polling.
    public Optional<BroadcastJobResponse> getPendingBroadcast(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        return jobBroadcastRepository
                .findByMechanicProfileIdAndStatus(profile.getId(), JobBroadcastStatus.SENT)
                .flatMap(broadcast -> jobRepository.findById(broadcast.getJobId())
                        .map(job -> new BroadcastJobResponse(
                                broadcast.getId(),
                                job.getId(),
                                job.getStatus(),
                                job.getVehicleType(),
                                job.getProblemType(),
                                job.getVehicleName(),
                                job.getAddress(),
                                job.getArea(),
                                job.getBroadcastRing(),
                                broadcast.getSentAt()
                        )));
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
        for (Job job : eligible) {
            JobBroadcast broadcast = new JobBroadcast();
            broadcast.setJobId(job.getId());
            broadcast.setMechanicProfileId(mechanic.getId());
            broadcast.setRing(job.getBroadcastRing());
            jobBroadcastRepository.save(broadcast);
        }
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
        }
    }
}
