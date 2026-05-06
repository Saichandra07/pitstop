package com.pitstop.pitstop_backend.job;

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

    public BroadcastScheduler(
            JobRepository jobRepository,
            JobBroadcastRepository jobBroadcastRepository,
            BroadcastService broadcastService
    ) {
        this.jobRepository = jobRepository;
        this.jobBroadcastRepository = jobBroadcastRepository;
        this.broadcastService = broadcastService;
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
            long totalInRing = jobBroadcastRepository.countByJobIdAndRing(
                    job.getId(), job.getBroadcastRing());

            // Advance if mechanics timed out (sentCount > 0)
            //         OR ring was empty — no broadcasts ever created (totalInRing == 0)
            // Skip if sentCount==0 && totalInRing>0: all declined inline, already handled.
            if (sentCount > 0 || totalInRing == 0) {
                broadcastService.advanceOrTimeout(job);
            }
        }
    }
}
