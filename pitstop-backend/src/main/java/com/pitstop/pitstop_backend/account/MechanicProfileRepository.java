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

    List<MechanicProfile> findAll();

    @Query("SELECT mp FROM MechanicProfile mp JOIN mp.account a WHERE " +
            "LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<MechanicProfile> searchByName(@Param("search") String search);

}
