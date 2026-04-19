package com.pitstop.pitstop_backend.account;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RejectionReasonRepository extends JpaRepository<RejectionReason, Long> {
}