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
    private Double averageRating;  // null for USER, null until first review for MECHANIC
    private Integer reviewCount;   // null for USER
    private Integer totalJobsCompleted; // null for USER
    private String profilePhotoUrl; // null for USER
    private String appealStatus;    // null for USER, enum name for MECHANIC

    public AccountMeResponse(Long id, String name, String email, String role,
                             VerificationStatus verificationStatus,
                             Boolean isAvailable, String rejectionReason,
                             Boolean hasExpertise,
                             Double averageRating, Integer reviewCount,
                             Integer totalJobsCompleted, String profilePhotoUrl,
                             String appealStatus) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.verificationStatus = verificationStatus;
        this.isAvailable = isAvailable;
        this.rejectionReason = rejectionReason;
        this.hasExpertise = hasExpertise;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.totalJobsCompleted = totalJobsCompleted;
        this.profilePhotoUrl = profilePhotoUrl;
        this.appealStatus = appealStatus;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public Boolean getIsAvailable() { return isAvailable; }
    public String getRejectionReason() { return rejectionReason; }
    public Boolean getHasExpertise() { return hasExpertise; }
    public Double getAverageRating() { return averageRating; }
    public Integer getReviewCount() { return reviewCount; }
    public Integer getTotalJobsCompleted() { return totalJobsCompleted; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public String getAppealStatus() { return appealStatus; }
}