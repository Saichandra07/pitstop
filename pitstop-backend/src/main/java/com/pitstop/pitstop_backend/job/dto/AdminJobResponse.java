package com.pitstop.pitstop_backend.job.dto;

public record AdminJobResponse(
        Long id,
        String userName,
        String mechanicName,
        String vehicleType,
        String problemType,
        String vehicleName,
        String area,
        String status,
        Integer broadcastRing,
        String createdAt,
        String updatedAt
) {}