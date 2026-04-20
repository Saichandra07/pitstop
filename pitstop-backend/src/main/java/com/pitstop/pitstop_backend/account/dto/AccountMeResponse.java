package com.pitstop.pitstop_backend.account.dto;

import com.pitstop.pitstop_backend.account.VerificationStatus;

public class AccountMeResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private VerificationStatus verificationStatus;
    private Boolean isAvailable;
    private String rejectionReason;
    private Boolean hasExpertise;  // null for USER, true/false for MECHANIC

    public AccountMeResponse(Long id, String name, String email, String role,
                             VerificationStatus verificationStatus,
                             Boolean isAvailable, String rejectionReason,
                             Boolean hasExpertise) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.verificationStatus = verificationStatus;
        this.isAvailable = isAvailable;
        this.rejectionReason = rejectionReason;
        this.hasExpertise = hasExpertise;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public Boolean getIsAvailable() { return isAvailable; }
    public String getRejectionReason() { return rejectionReason; }
    public Boolean getHasExpertise() { return hasExpertise; }
}