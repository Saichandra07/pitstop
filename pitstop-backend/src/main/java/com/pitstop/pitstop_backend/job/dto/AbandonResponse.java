package com.pitstop.pitstop_backend.job.dto;

public record AbandonResponse(
        boolean showOffer,
        Long jobId,
        String problemType,
        String vehicleType,
        String vehicleName,
        String area
) {}
