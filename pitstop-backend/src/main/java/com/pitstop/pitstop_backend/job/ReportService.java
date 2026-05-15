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

    private static final String WRONG_PHONE_REASON = "Wrong/non-working phone number";
    private static final String UNREACHABLE_REASON = "Mechanic unreachable (phone + chat)";

    public void submitReport(Long accountId, Long jobId, String reason, String description) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getAccountId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        }

        boolean isPhoneReason = WRONG_PHONE_REASON.equals(reason) || UNREACHABLE_REASON.equals(reason);

        boolean isActive = job.getStatus() == JobStatus.IN_PROGRESS
                || job.getStatus() == JobStatus.ARRIVAL_REQUESTED
                || job.getStatus() == JobStatus.COMPLETION_REQUESTED
                || (isPhoneReason && job.getStatus() == JobStatus.ACCEPTED);
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

        if (isPhoneReason) {
            long completedJobs = jobRepository.countByAccountIdAndStatus(accountId, JobStatus.COMPLETED);
            Account reporter = accountRepository.findById(accountId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
            boolean accountOldEnough = reporter.getCreatedAt().isBefore(LocalDateTime.now().minusDays(30));
            if (completedJobs < 2 && !accountOldEnough) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Account must have 2+ completed jobs or be 30+ days old to file this report type");
            }
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

        if (isPhoneReason) {
            mechanicProfileRepository.findById(job.getMechanicProfileId()).ifPresent(mechanic -> {
                if (mechanic.getAppealStatus() == AppealStatus.APPROVED) {
                    int count = (mechanic.getWrongNumberReportCountPostAppeal() == null ? 0
                            : mechanic.getWrongNumberReportCountPostAppeal()) + 1;
                    mechanic.setWrongNumberReportCountPostAppeal(count);
                    if (count >= 2) {
                        Account mechanicAccount = mechanic.getAccount();
                        mechanicAccount.setIsBanned(true);
                        accountRepository.save(mechanicAccount);
                    }
                    mechanicProfileRepository.save(mechanic);
                }
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

    // System-generated report — bypasses maturity guard, used by escape hatch
    @Transactional
    public void fileAutoReport(Long jobId, Long userAccountId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getMechanicProfileId() == null) return;

        if (reportRepository.existsByReporterIdAndJobId(userAccountId, jobId)) return;

        Report report = new Report();
        report.setReporterId(userAccountId);
        report.setMechanicId(job.getMechanicProfileId());
        report.setJobId(jobId);
        report.setReason(UNREACHABLE_REASON);
        report.setDescription("Auto-filed: mechanic did not respond within 5 minutes of reach alert");
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

    public void resolveReport(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(ReportStatus.REVIEWED);
        reportRepository.save(report);
    }
}
