package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rejection_reasons")
public class RejectionReason {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The reason text shown to mechanic on rejection — managed by admin
    @Column(nullable = false, unique = true)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}