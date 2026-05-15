package com.pitstop.pitstop_backend.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface MechanicProfileRepository extends JpaRepository<MechanicProfile, Long> {

    Optional<MechanicProfile> findByAccount(Account account);

    Optional<MechanicProfile> findByAccountId(Long accountId);

    List<MechanicProfile> findByVerificationStatus(VerificationStatus status);

    List<MechanicProfile> findByAppealStatus(AppealStatus appealStatus);

    List<MechanicProfile> findByVerificationStatusAndSuspensionEndsAtBefore(VerificationStatus status, java.time.LocalDateTime cutoff);

    List<MechanicProfile> findAll();

    @Query("SELECT mp FROM MechanicProfile mp JOIN mp.account a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(mp.area) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<MechanicProfile> searchByNameOrArea(@Param("query") String query);

    // Haversine distance filter — runs entirely in PostgreSQL, no Java-side filtering.
    // Returns verified, online mechanics within the ring band [minKm, maxKm] from the job location,
    // who handle the required vehicleType, and haven't already been sent this job.
    // Count of online, verified mechanics within radiusKm of a given point.
    // Used for the user dashboard "nearby" counter.
    @Query(value = """
            SELECT COUNT(DISTINCT mp.id) FROM mechanic_profile mp
            WHERE mp.is_available = true
            AND mp.verification_status = 'VERIFIED'
            AND mp.latitude IS NOT NULL AND mp.longitude IS NOT NULL
            AND (6371 * acos(LEAST(1.0,
                cos(radians(:lat)) * cos(radians(mp.latitude))
                * cos(radians(mp.longitude) - radians(:lng))
                + sin(radians(:lat)) * sin(radians(mp.latitude))
            ))) <= :radiusKm
            """, nativeQuery = true)
    Integer countNearbyAvailable(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm
    );

    @Query(value = """
            SELECT DISTINCT mp.* FROM mechanic_profile mp
            WHERE mp.is_available = true
            AND mp.verification_status = 'VERIFIED'
            AND mp.latitude IS NOT NULL AND mp.longitude IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM mechanic_expertise me
                WHERE me.mechanic_profile_id = mp.id
                AND me.wheeler_type = :vehicleType
            )
            AND NOT EXISTS (
                SELECT 1 FROM job_broadcast jb
                WHERE jb.job_id = :jobId AND jb.mechanic_profile_id = mp.id
            )
            AND (6371 * acos(LEAST(1.0,
                cos(radians(:lat)) * cos(radians(mp.latitude))
                * cos(radians(mp.longitude) - radians(:lng))
                + sin(radians(:lat)) * sin(radians(mp.latitude))
            ))) BETWEEN :minKm AND :maxKm
            """, nativeQuery = true)
    List<MechanicProfile> findEligibleMechanicsInRing(
            @Param("jobId") Long jobId,
            @Param("vehicleType") String vehicleType,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("minKm") double minKm,
            @Param("maxKm") double maxKm
    );

}
