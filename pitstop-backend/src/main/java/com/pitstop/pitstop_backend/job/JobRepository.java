package com.pitstop.pitstop_backend.job;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByAccountId(Long accountId);
    List<Job> findByMechanicProfileId(Long mechanicProfileId);
    List<Job> findByStatus(JobStatus status);

    // Active jobs for a user — PENDING, ACCEPTED, IN_PROGRESS
    List<Job> findByAccountIdAndStatusIn(Long accountId, List<JobStatus> statuses);

    // History for a user — COMPLETED, CANCELLED
    // (reuses findByAccountIdAndStatusIn — same method, different statuses passed at call site)

    // One-active-SOS guard — check if user already has an active job
    boolean existsByAccountIdAndStatusIn(Long accountId, List<JobStatus> statuses);

    // Used by mechanic to find an assignable job
    Optional<Job> findByIdAndStatus(Long id, JobStatus status);

    List<Job> findByMechanicProfileIdAndStatusIn(Long mechanicProfileId, List<JobStatus> statuses);
}