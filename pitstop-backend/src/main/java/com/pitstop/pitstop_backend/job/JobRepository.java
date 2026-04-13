package com.pitstop.pitstop_backend.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByAccountId(Long accountId);
    List<Job> findByMechanicProfileId(Long mechanicProfileId);
    List<Job> findByStatus(JobStatus status);

}
