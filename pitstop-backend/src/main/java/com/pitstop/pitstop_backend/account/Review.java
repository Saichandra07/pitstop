package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which job this review is for
    @Column(nullable = true)
    private Long jobId;

    // Which mechanic is being reviewed
    @Column(nullable = false)
    private Long mechanicId;

    // Who submitted the review — NULL if system-generated penalty review
    @Column(nullable = true)
    private Long reviewerId;

    // Comma-separated quick tags (e.g. "Arrived fast,Professional")
    @Column(nullable = true)
    private String tags;

    // 1-5 stars
    @Column(nullable = false)
    private Integer rating;

    // Optional text comment from user
    @Column(nullable = true)
    private String comment;

    // True = penalty review injected by system (mid-job cancel, offline during job)
    // Hidden from public trust profile, visible to admin only
    @Column(nullable = false)
    private Boolean isSystemGenerated = false;

    // Only set on system reviews — explains why penalty was injected
    // e.g. "Mid-job cancellation", "Went offline during active job"
    @Column(nullable = true)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.isSystemGenerated = false;
    }

    public Long getId() { return id; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public Long getMechanicId() { return mechanicId; }
    public void setMechanicId(Long mechanicId) { this.mechanicId = mechanicId; }

    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Boolean getIsSystemGenerated() { return isSystemGenerated; }
    public void setIsSystemGenerated(Boolean isSystemGenerated) { this.isSystemGenerated = isSystemGenerated; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}