package com.pitstop.pitstop_backend.job.dto;

import com.pitstop.pitstop_backend.job.JobStatus;
import com.pitstop.pitstop_backend.job.ProblemType;
import com.pitstop.pitstop_backend.job.VehicleType;

import java.time.LocalDateTime;

public record BroadcastJobResponse(
        Long broadcastId,
        Long jobId,
        JobStatus jobStatus,
        VehicleType vehicleType,
        ProblemType problemType,
        String vehicleName,
        String address,
        String area,
        Integer broadcastRing,
        LocalDateTime sentAt
) {}
