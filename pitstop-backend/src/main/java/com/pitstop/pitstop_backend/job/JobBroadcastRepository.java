package com.pitstop.pitstop_backend.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface JobBroadcastRepository extends JpaRepository<JobBroadcast, Long> {

    List<JobBroadcast> findByJobIdAndStatus(Long jobId, JobBroadcastStatus status);

    Optional<JobBroadcast> findByMechanicProfileIdAndStatus(Long mechanicProfileId, JobBroadcastStatus status);

    Optional<JobBroadcast> findByJobIdAndMechanicProfileId(Long jobId, Long mechanicProfileId);

    boolean existsByJobIdAndMechanicProfileId(Long jobId, Long mechanicProfileId);

    long countByJobId(Long jobId);

    long countByJobIdAndRingAndStatus(Long jobId, Integer ring, JobBroadcastStatus status);

    long countByJobIdAndRing(Long jobId, Integer ring);

    // Counts broadcasts for a job's current ring sent AFTER a given timestamp.
    // Used by the scheduler to ignore broadcasts from previous job lifecycles (pre-abandon).
    long countByJobIdAndRingAndSentAtGreaterThanEqual(Long jobId, Integer ring, LocalDateTime from);

    // Expire all outstanding broadcasts for a job (used when job times out or is cancelled)
    @Modifying
    @Transactional
    @Query("UPDATE JobBroadcast jb SET jb.status = 'EXPIRED' WHERE jb.jobId = :jobId AND jb.status = 'SENT'")
    void expireAllSentForJob(@Param("jobId") Long jobId);

    // Expire all SENT broadcasts for a job except the accepting mechanic
    @Modifying
    @Transactional
    @Query("UPDATE JobBroadcast jb SET jb.status = 'EXPIRED' WHERE jb.jobId = :jobId AND jb.mechanicProfileId != :mechanicProfileId AND jb.status = 'SENT'")
    void expireAllSentForJobExcept(@Param("jobId") Long jobId, @Param("mechanicProfileId") Long mechanicProfileId);
}
