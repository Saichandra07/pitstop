package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mechanic_profile")
public class MechanicProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(nullable = false)
    private String phone;

    // expertise String field removed — replaced by mechanic_expertise table

    @Column(nullable = false)
    private Double serviceRadiusKm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus;

    @Column(nullable = false)
    private Boolean isAvailable;

    // Total jobs successfully completed by this mechanic
    @Column(nullable = false)
    private Integer totalJobsCompleted = 0;

    // How many times this mechanic cancelled mid-job — shown on trust profile if > 0
    @Column(nullable = false)
    private Integer midJobCancels = 0;

    // Set when mechanic is suspended — null means not suspended
    @Column(nullable = true)
    private LocalDateTime suspensionEndsAt;

    // Tracks appeal state for current suspension
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppealStatus appealStatus;

    // Text of the mechanic's appeal submission
    @Column(nullable = true)
    private String appealReason;

    // Updated every 30s by frontend ping during active job — used by heartbeat scheduler
    @Column(nullable = true)
    private LocalDateTime lastHeartbeatAt;

    // Reason shown to mechanic on rejection screen — set by admin on reject
    @Column(nullable = true)
    private String rejectionReason;

    @Column(name = "area")
    private String area;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    @Column(nullable = true)
    private Double latitude;

    @Column(nullable = true)
    private Double longitude;

    // Saved when mechanic accepts a job (before lat/lng are cleared).
    // Restored when user cancels, so mechanic automatically comes back online.
    @Column(nullable = true)
    private Double lastKnownLatitude;

    @Column(nullable = true)
    private Double lastKnownLongitude;

    @PrePersist
    protected void onCreate() {
        if (this.verificationStatus == null) {
            this.verificationStatus = VerificationStatus.UNVERIFIED;
        }
        if (this.isAvailable == null) {
            this.isAvailable = false;
        }
        if (this.totalJobsCompleted == null) {
            this.totalJobsCompleted = 0;
        }
        if (this.midJobCancels == null) {
            this.midJobCancels = 0;
        }
        if (this.appealStatus == null) {
            this.appealStatus = AppealStatus.NONE;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Double getServiceRadiusKm() { return serviceRadiusKm; }
    public void setServiceRadiusKm(Double serviceRadiusKm) { this.serviceRadiusKm = serviceRadiusKm; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Integer getTotalJobsCompleted() { return totalJobsCompleted; }
    public void setTotalJobsCompleted(Integer totalJobsCompleted) { this.totalJobsCompleted = totalJobsCompleted; }

    public Integer getMidJobCancels() { return midJobCancels; }
    public void setMidJobCancels(Integer midJobCancels) { this.midJobCancels = midJobCancels; }

    public LocalDateTime getSuspensionEndsAt() { return suspensionEndsAt; }
    public void setSuspensionEndsAt(LocalDateTime suspensionEndsAt) { this.suspensionEndsAt = suspensionEndsAt; }

    public AppealStatus getAppealStatus() { return appealStatus; }
    public void setAppealStatus(AppealStatus appealStatus) { this.appealStatus = appealStatus; }

    public String getAppealReason() { return appealReason; }
    public void setAppealReason(String appealReason) { this.appealReason = appealReason; }

    public LocalDateTime getLastHeartbeatAt() { return lastHeartbeatAt; }
    public void setLastHeartbeatAt(LocalDateTime lastHeartbeatAt) { this.lastHeartbeatAt = lastHeartbeatAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getSuspensionReason() { return suspensionReason; }
    public void setSuspensionReason(String suspensionReason) { this.suspensionReason = suspensionReason; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getLastKnownLatitude() { return lastKnownLatitude; }
    public void setLastKnownLatitude(Double lastKnownLatitude) { this.lastKnownLatitude = lastKnownLatitude; }

    public Double getLastKnownLongitude() { return lastKnownLongitude; }
    public void setLastKnownLongitude(Double lastKnownLongitude) { this.lastKnownLongitude = lastKnownLongitude; }
}