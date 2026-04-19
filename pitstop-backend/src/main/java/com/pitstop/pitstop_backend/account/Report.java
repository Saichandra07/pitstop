package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User who filed the report
    @Column(nullable = false)
    private Long reporterId;

    // Mechanic being reported
    @Column(nullable = false)
    private Long mechanicId;

    // Which job this report is about
    @Column(nullable = false)
    private Long jobId;

    // Reason selected from dropdown:
    // Unprofessional behavior, Overcharged/scammed, Refused to work,
    // Threatening behavior, Other
    @Column(nullable = false)
    private String reason;

    // Optional extra detail from the user
    @Column(nullable = true)
    private String description;

    // PENDING until admin reviews it
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = ReportStatus.PENDING;
    }

    public Long getId() { return id; }

    public Long getReporterId() { return reporterId; }
    public void setReporterId(Long reporterId) { this.reporterId = reporterId; }

    public Long getMechanicId() { return mechanicId; }
    public void setMechanicId(Long mechanicId) { this.mechanicId = mechanicId; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}