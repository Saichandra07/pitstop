package com.pitstop.pitstop_backend.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByAccountId(Long accountId);
    List<Job> findByMechanicProfileId(Long mechanicProfileId);
    List<Job> findByStatus(JobStatus status);

    // Active jobs for a user — PENDING, ACCEPTED, IN_PROGRESS
    List<Job> findByAccountIdAndStatusIn(Long accountId, List<JobStatus> statuses);

    // History for a user — COMPLETED, CANCELLED, newest first
    List<Job> findByAccountIdAndStatusInOrderByCreatedAtDesc(Long accountId, List<JobStatus> statuses);

    // One-active-SOS guard — check if user already has an active job
    boolean existsByAccountIdAndStatusIn(Long accountId, List<JobStatus> statuses);

    // Used by mechanic to find an assignable job
    Optional<Job> findByIdAndStatus(Long id, JobStatus status);

    boolean existsByMechanicProfileIdAndStatusIn(Long mechanicProfileId, List<JobStatus> statuses);

    List<Job> findByMechanicProfileIdAndStatusIn(Long mechanicProfileId, List<JobStatus> statuses);

    List<Job> findByMechanicProfileIdAndStatusInOrderByCreatedAtDesc(Long mechanicProfileId, List<JobStatus> statuses);

    List<Job> findAllByOrderByCreatedAtDesc();

    List<Job> findByStatusOrderByCreatedAtDesc(JobStatus status);

    @Query("SELECT j FROM Job j LEFT JOIN Account ua ON j.accountId = ua.id " +
            "WHERE LOWER(ua.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(j.area) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Job> searchByUserNameOrArea(@Param("search") String search);

    // Scheduler uses this to find PENDING jobs whose current ring timer has expired
    List<Job> findByStatusAndBroadcastStartedAtBefore(JobStatus status, LocalDateTime cutoff);

    // Reverse of findEligibleMechanicsInRing — finds PENDING jobs a newly-online mechanic
    // is eligible for and hasn't already received a broadcast for.
    @Query(value = """
            SELECT DISTINCT j.* FROM jobs j
            WHERE j.status = 'PENDING'
            AND EXISTS (
                SELECT 1 FROM mechanic_expertise me
                WHERE me.mechanic_profile_id = :mechanicProfileId
                AND me.wheeler_type = j.vehicle_type
            )
            AND NOT EXISTS (
                SELECT 1 FROM job_broadcast jb
                WHERE jb.job_id = j.id AND jb.mechanic_profile_id = :mechanicProfileId
                AND jb.status IN ('SENT', 'DECLINED')
            )
            AND (6371 * acos(LEAST(1.0,
                cos(radians(j.latitude)) * cos(radians(:lat))
                * cos(radians(:lng) - radians(j.longitude))
                + sin(radians(j.latitude)) * sin(radians(:lat))
            ))) <= LEAST(:maxKm,
                CASE j.broadcast_ring
                    WHEN 1 THEN 2.0
                    WHEN 2 THEN 5.0
                    WHEN 3 THEN 10.0
                    ELSE 20.0
                END
            )
            """, nativeQuery = true)
    List<Job> findEligiblePendingJobsForMechanic(
            @Param("mechanicProfileId") Long mechanicProfileId,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("maxKm") double maxKm
    );
}