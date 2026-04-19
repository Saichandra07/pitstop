package com.pitstop.pitstop_backend.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MechanicProfileRepository extends JpaRepository<MechanicProfile, Long> {

    Optional<MechanicProfile> findByAccount(Account account);

    Optional<MechanicProfile> findByAccountId(Long accountId);

    List<MechanicProfile> findByVerificationStatus(VerificationStatus status);

}
