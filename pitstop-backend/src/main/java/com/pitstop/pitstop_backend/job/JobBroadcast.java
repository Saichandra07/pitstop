package com.pitstop.pitstop_backend.job;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_broadcast")
public class JobBroadcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobId;

    @Column(nullable = false)
    private Long mechanicProfileId;

    @Column(nullable = false)
    private Integer ring;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobBroadcastStatus status;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (this.sentAt == null) this.sentAt = LocalDateTime.now();
        if (this.status == null) this.status = JobBroadcastStatus.SENT;
    }

    public Long getId() { return id; }
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public Long getMechanicProfileId() { return mechanicProfileId; }
    public void setMechanicProfileId(Long mechanicProfileId) { this.mechanicProfileId = mechanicProfileId; }
    public Integer getRing() { return ring; }
    public void setRing(Integer ring) { this.ring = ring; }
    public JobBroadcastStatus getStatus() { return status; }
    public void setStatus(JobBroadcastStatus status) { this.status = status; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
