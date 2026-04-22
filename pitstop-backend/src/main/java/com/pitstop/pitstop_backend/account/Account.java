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

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private UpgradeStatus upgradeStatus;

    // Counts post-acceptance cancellations — resets after 30 days (enforced in service)
    @Column(nullable = false)
    private Integer sosCancelCount = 0;

    // If set, user cannot send SOS until this timestamp passes
    @Column(nullable = true)
    private LocalDateTime sosTimeoutUntil;

    // Admin hard-ban — banned user cannot login at all
    @Column(nullable = false)
    private Boolean isBanned = false;

    @Column(nullable = false)
    private boolean emailVerified = false;

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

    public UpgradeStatus getUpgradeStatus() { return upgradeStatus; }
    public void setUpgradeStatus(UpgradeStatus upgradeStatus) { this.upgradeStatus = upgradeStatus; }

    public Integer getSosCancelCount() { return sosCancelCount; }
    public void setSosCancelCount(Integer sosCancelCount) { this.sosCancelCount = sosCancelCount; }

    public LocalDateTime getSosTimeoutUntil() { return sosTimeoutUntil; }
    public void setSosTimeoutUntil(LocalDateTime sosTimeoutUntil) { this.sosTimeoutUntil = sosTimeoutUntil; }

    public Boolean getIsBanned() { return isBanned; }
    public void setIsBanned(Boolean isBanned) { this.isBanned = isBanned; }

    public boolean isEmailVerified() {
        return emailVerified;
    }
    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
}