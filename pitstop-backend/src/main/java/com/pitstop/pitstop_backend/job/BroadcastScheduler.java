package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.account.MechanicProfile;
import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.account.VerificationStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

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
