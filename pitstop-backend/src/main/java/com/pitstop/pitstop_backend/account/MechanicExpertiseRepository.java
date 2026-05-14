// account/MechanicExpertiseRepository.java
package com.pitstop.pitstop_backend.account;

import com.pitstop.pitstop_backend.job.ProblemType;
import com.pitstop.pitstop_backend.job.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface MechanicExpertiseRepository extends JpaRepository<MechanicExpertise, Long> {

    // Used in broadcast matching — does this mechanic cover this exact job?
    boolean existsByMechanicProfileIdAndWheelerTypeAndProblemType(
            Long mechanicProfileId,
            VehicleType wheelerType,
            ProblemType problemType
    );

    // Used for DONT_KNOW jobs — only vehicleType matters, any problem expertise counts
    boolean existsByMechanicProfileIdAndWheelerType(
            Long mechanicProfileId,
            VehicleType wheelerType
    );

    // Used in expertise edit — wipe all rows for this mechanic before re-inserting
    @Modifying
    @Transactional
    @Query("DELETE FROM MechanicExpertise me WHERE me.mechanicProfileId = :mechanicProfileId")
    void deleteAllByMechanicProfileId(Long mechanicProfileId);

    boolean existsByMechanicProfileId(Long mechanicProfileId);
}