package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.account.MechanicProfile;
import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.account.VerificationStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Component
@ConditionalOnProperty(name = "broadcast.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class BroadcastScheduler {

    private final JobRepository jobRepository;
    private final JobBroadcastRepository jobBroadcastRepository;
    private final BroadcastService broadcastService;
    private final MechanicProfileRepository mechanicProfileRepository;

    public BroadcastScheduler(
            JobRepository jobRepository,
            JobBroadcastRepository jobBroadcastRepository,
            BroadcastService broadcastService,
            MechanicProfileRepository mechanicProfileRepository
    ) {
        this.jobRepository = jobRepository;
        this.jobBroadcastRepository = jobBroadcastRepository;
        this.broadcastService = broadcastService;
        this.mechanicProfileRepository = mechanicProfileRepository;
    }

    // Runs every 30s. Finds PENDING jobs whose current ring has been live for > 2 mins.
    // If mechanics haven't all responded yet, the time limit is hit → advance ring.
    @Scheduled(fixedDelay = 30_000)
    public void checkStaleRings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);
        List<Job> staleJobs = jobRepository.findByStatusAndBroadcastStartedAtBefore(
                JobStatus.PENDING, cutoff);

        for (Job job : staleJobs) {
            long sentCount = jobBroadcastRepository.countByJobIdAndRingAndStatus(
                    job.getId(), job.getBroadcastRing(), JobBroadcastStatus.SENT);

            // Count only broadcasts from the current ring lifecycle (sentAt >= broadcastStartedAt).
            // This ignores stale rows from a previous assignment (e.g. after mechanic-abandon),
            // which would otherwise prevent the "ring was empty" path from ever firing.
            long currentLifecycleCount = jobBroadcastRepository
                    .countByJobIdAndRingAndSentAtGreaterThanEqual(
                            job.getId(), job.getBroadcastRing(), job.getBroadcastStartedAt());

            // Advance if mechanics timed out (sentCount > 0)
            //         OR ring was empty in this lifecycle — no broadcasts created (currentLifecycleCount == 0)
            if (sentCount > 0 || currentLifecycleCount == 0) {
                broadcastService.advanceOrTimeout(job);
            }
        }
    }

    // Runs every 60s — finds mechanics with stale heartbeats during active jobs and triggers
    // involuntary abandon (rebroadcast + penalty), matching the spec's 5-minute offline rule.
    @Scheduled(fixedDelay = 60_000)
    public void checkStaleHeartbeats() {
        List<JobStatus> activeStatuses = List.of(
                JobStatus.ACCEPTED, JobStatus.ARRIVAL_REQUESTED,
                JobStatus.IN_PROGRESS, JobStatus.COMPLETION_REQUESTED
        );
        LocalDateTime staleAt = LocalDateTime.now().minusMinutes(5);

        for (Job job : jobRepository.findByStatusIn(activeStatuses)) {
            if (job.getMechanicProfileId() == null) continue;

            MechanicProfile mp = mechanicProfileRepository
                    .findById(job.getMechanicProfileId()).orElse(null);
            if (mp == null) continue;

            // null = mechanic hasn't heartbeated yet (pre-feature or just accepted) — skip
            if (mp.getLastHeartbeatAt() == null) continue;
            if (!mp.getLastHeartbeatAt().isBefore(staleAt)) continue;

            try {
                broadcastService.mechanicAbandon(job.getId(), mp.getAccount().getId());
            } catch (Exception ignored) {
                // Race condition — job may have ended between query and this call
            }
        }
    }

    // Runs at 12:01 AM daily — lifts day suspensions that expired at midnight.
    @Scheduled(cron = "0 1 0 * * *")
    public void liftExpiredSuspensions() {
        List<MechanicProfile> suspended = mechanicProfileRepository
                .findByVerificationStatusAndSuspensionEndsAtBefore(
                        VerificationStatus.SUSPENDED, LocalDateTime.now());
        for (MechanicProfile mp : suspended) {
            mp.setVerificationStatus(VerificationStatus.VERIFIED);
            mp.setSuspensionEndsAt(null);
            mechanicProfileRepository.save(mp);
        }
    }
}
