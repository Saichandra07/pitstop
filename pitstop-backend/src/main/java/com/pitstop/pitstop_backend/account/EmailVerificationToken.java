package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification_tokens")
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private Long accountId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    public EmailVerificationToken() {}

    public EmailVerificationToken(String token, Long accountId, String email, LocalDateTime expiresAt) {
        this.token = token;
        this.accountId = accountId;
        this.email = email;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public Long getAccountId() { return accountId; }
    public String getEmail() { return email; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}