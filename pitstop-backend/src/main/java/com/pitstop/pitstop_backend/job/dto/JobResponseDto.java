package com.pitstop.pitstop_backend.job.dto;

import com.pitstop.pitstop_backend.job.JobStatus;
import com.pitstop.pitstop_backend.job.ProblemType;
import com.pitstop.pitstop_backend.job.VehicleType;

import java.time.LocalDateTime;

public class JobResponseDto {
    private Long id;
    private Long accountId;
    private Long mechanicProfileId;
    private JobStatus status;
    private VehicleType vehicleType;
    private ProblemType problemType;
    private String vehicleName;
    private String photoUrl;
    private String address;
    private String description;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public JobResponseDto(Long id, Long accountId, Long mechanicProfileId,
                          JobStatus status, VehicleType vehicleType, ProblemType problemType,
                          String vehicleName, String photoUrl,
                          String address, String description, Double latitude, Double longitude,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.accountId = accountId;
        this.mechanicProfileId = mechanicProfileId;
        this.status = status;
        this.vehicleType = vehicleType;
        this.problemType = problemType;
        this.vehicleName = vehicleName;
        this.photoUrl = photoUrl;
        this.address = address;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getAccountId() { return accountId; }
    public Long getMechanicProfileId() { return mechanicProfileId; }
    public JobStatus getStatus() { return status; }
    public VehicleType getVehicleType() { return vehicleType; }
    public ProblemType getProblemType() { return problemType; }
    public String getVehicleName() { return vehicleName; }
    public String getPhotoUrl() { return photoUrl; }
    public String getAddress() { return address; }
    public String getDescription() { return description; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}