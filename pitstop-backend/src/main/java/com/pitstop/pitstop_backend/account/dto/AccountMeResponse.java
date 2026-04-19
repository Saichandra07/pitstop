package com.pitstop.pitstop_backend.account.dto;

import com.pitstop.pitstop_backend.account.VerificationStatus;

public class AccountMeResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private VerificationStatus verificationStatus; // null for USER
    private Boolean isAvailable;                   // null for USER
    private String rejectionReason;                // null unless REJECTED

    public AccountMeResponse(Long id, String name, String email, String role,
                             VerificationStatus verificationStatus,
                             Boolean isAvailable, String rejectionReason) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.verificationStatus = verificationStatus;
        this.isAvailable = isAvailable;
        this.rejectionReason = rejectionReason;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public Boolean getIsAvailable() { return isAvailable; }
    public String getRejectionReason() { return rejectionReason; }
}