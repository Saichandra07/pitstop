package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.account.*;
import com.pitstop.pitstop_backend.job.dto.AdminReportResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final JobRepository jobRepository;
    private final MechanicProfileRepository mechanicProfileRepository;
    private final AccountRepository accountRepository;

    public ReportService(ReportRepository reportRepository,
                         JobRepository jobRepository,
                         MechanicProfileRepository mechanicProfileRepository,
                         AccountRepository accountRepository) {
        this.reportRepository = reportRepository;
        this.jobRepository = jobRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
        this.accountRepository = accountRepository;
    }

    public void submitReport(Long accountId, Long jobId, String reason, String description) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getAccountId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        }

        boolean isActive = job.getStatus() == JobStatus.IN_PROGRESS
                || job.getStatus() == JobStatus.ARRIVAL_REQUESTED
                || job.getStatus() == JobStatus.COMPLETION_REQUESTED;
        boolean isRecentlyCompleted = job.getStatus() == JobStatus.COMPLETED
                && job.getUpdatedAt() != null
                && job.getUpdatedAt().isAfter(LocalDateTime.now().minusHours(24));

        if (!isActive && !isRecentlyCompleted) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reporting window closed");
        }

        if (job.getMechanicProfileId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No mechanic assigned to this job");
        }

        if (reportRepository.existsByReporterIdAndJobId(accountId, jobId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already reported this job");
        }

        Report report = new Report();
        report.setReporterId(accountId);
        report.setMechanicId(job.getMechanicProfileId());
        report.setJobId(jobId);
        report.setReason(reason);
        report.setDescription(description);
        reportRepository.save(report);

        long pendingCount = reportRepository.countByMechanicIdAndStatus(
                job.getMechanicProfileId(), ReportStatus.PENDING);
        if (pendingCount >= 3) {
            mechanicProfileRepository.findById(job.getMechanicProfileId()).ifPresent(mp -> {
                mp.setVerificationStatus(VerificationStatus.SUSPENDED);
                mp.setIsAvailable(false);
                mechanicProfileRepository.save(mp);
            });
        }
    }

    @Transactional(readOnly = true)
    public List<AdminReportResponse> getAdminReports() {
        return reportRepository.findByStatus(ReportStatus.PENDING)
                .stream()
                .map(r -> {
                    String reporterName = accountRepository.findById(r.getReporterId())
                            .map(Account::getName).orElse("Unknown");
                    String mechanicName = mechanicProfileRepository.findById(r.getMechanicId())
                            .map(mp -> mp.getAccount().getName()).orElse("Unknown");
                    return new AdminReportResponse(
                            r.getId(),
                            r.getJobId(),
                            reporterName,
                            mechanicName,
                            r.getReason(),
                            r.getDescription(),
                            r.getStatus().name(),
                            r.getCreatedAt().toString()
                    );
                })
                .collect(Collectors.toList());
    }

    public void resolveReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(ReportStatus.REVIEWED);
        reportRepository.save(report);
    }
}
