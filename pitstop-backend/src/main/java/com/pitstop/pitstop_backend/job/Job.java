package com.pitstop.pitstop_backend.job;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version = 0L;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "mechanic_profile_id", nullable = true)
    private Long mechanicProfileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    private ProblemType problemType;

    // Required — user tells us what vehicle it is (e.g. "Honda Activa")
    @Column(nullable = false)
    private String vehicleName;

    // Cloudinary URL — set after photo upload, nullable (photo is optional)
    @Column(nullable = true)
    private String photoUrl;

    // Tracks which broadcast ring is currently active (1-4). Starts at 1.
    @Column(nullable = false)
    private Integer broadcastRing = 1;

    // When the current broadcast ring started — scheduler uses this to check 2 min timeout
    @Column(nullable = true)
    private LocalDateTime broadcastStartedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private CancellationReason cancellationReason;

    private String address;
    private String description;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Column(name = "area")
    private String area;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }

    public Long getMechanicProfileId() { return mechanicProfileId; }
    public void setMechanicProfileId(Long mechanicProfileId) { this.mechanicProfileId = mechanicProfileId; }

    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }

    public VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }

    public ProblemType getProblemType() { return problemType; }
    public void setProblemType(ProblemType problemType) { this.problemType = problemType; }

    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Integer getBroadcastRing() { return broadcastRing; }
    public void setBroadcastRing(Integer broadcastRing) { this.broadcastRing = broadcastRing; }

    public LocalDateTime getBroadcastStartedAt() { return broadcastStartedAt; }
    public void setBroadcastStartedAt(LocalDateTime broadcastStartedAt) { this.broadcastStartedAt = broadcastStartedAt; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public CancellationReason getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(CancellationReason cancellationReason) { this.cancellationReason = cancellationReason; }
}