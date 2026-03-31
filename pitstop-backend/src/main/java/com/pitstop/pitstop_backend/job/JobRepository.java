package com.pitstop.pitstop_backend.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByUserId(Long userId);
    List<Job> findByMechanicId(Long mechanicId);
    List<Job> findByStatus(JobStatus status);

}
