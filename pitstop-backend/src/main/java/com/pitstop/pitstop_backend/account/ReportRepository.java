package com.pitstop.pitstop_backend.account;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByReporterIdAndJobId(Long reporterId, Long jobId);
    long countByMechanicIdAndStatus(Long mechanicId, ReportStatus status);
    List<Report> findByStatus(ReportStatus status);
}
