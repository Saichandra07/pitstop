package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Counts post-acceptance cancellations within the 30-day window
    @Column(nullable = false)
    private Integer sosCancelCount = 0;

    // When the current 30-day cancel window expires — set on first cancel in a new window
    @Column(nullable = true)
    private LocalDateTime sosCancelCountResetAt;

    // If set, user cannot send SOS until this timestamp passes
    @Column(nullable = true)
    private LocalDateTime sosTimeoutUntil;

    // Last time a password reset email was requested — used to enforce 1/min rate limit
    @Column(nullable = true)
    private LocalDateTime lastPasswordResetRequestAt;

    // Admin hard-ban — banned user cannot login at all
    @Column(nullable = false)
    private Boolean isBanned = false;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = true)
    private String profilePhotoUrl;

    @Column(nullable = true)
    private String phone;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.sosCancelCount = 0;
        this.isBanned = false;
    }

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Integer getSosCancelCount() { return sosCancelCount; }
    public void setSosCancelCount(Integer sosCancelCount) { this.sosCancelCount = sosCancelCount; }

    public LocalDateTime getSosCancelCountResetAt() { return sosCancelCountResetAt; }
    public void setSosCancelCountResetAt(LocalDateTime sosCancelCountResetAt) { this.sosCancelCountResetAt = sosCancelCountResetAt; }

    public LocalDateTime getSosTimeoutUntil() { return sosTimeoutUntil; }
    public void setSosTimeoutUntil(LocalDateTime sosTimeoutUntil) { this.sosTimeoutUntil = sosTimeoutUntil; }

    public LocalDateTime getLastPasswordResetRequestAt() { return lastPasswordResetRequestAt; }
    public void setLastPasswordResetRequestAt(LocalDateTime lastPasswordResetRequestAt) { this.lastPasswordResetRequestAt = lastPasswordResetRequestAt; }

    public Boolean getIsBanned() { return isBanned; }
    public void setIsBanned(Boolean isBanned) { this.isBanned = isBanned; }

    public boolean isEmailVerified() {
        return emailVerified;
    }
    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}