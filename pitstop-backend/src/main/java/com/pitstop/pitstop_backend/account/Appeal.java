package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appeals")
public class Appeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which mechanic submitted this appeal
    @Column(nullable = false)
    private Long mechanicId;

    // The mechanic's appeal text — "I lost signal, I was still there..."
    @Column(nullable = false)
    private String reason;

    // Current state of the appeal — admin changes this on approve/reject
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppealStatus status = AppealStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = AppealStatus.PENDING;
    }

    public Long getId() { return id; }

    public Long getMechanicId() { return mechanicId; }
    public void setMechanicId(Long mechanicId) { this.mechanicId = mechanicId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public AppealStatus getStatus() { return status; }
    public void setStatus(AppealStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}