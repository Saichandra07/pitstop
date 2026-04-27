package com.pitstop.pitstop_backend.account.dto;

public record AdminMechanicResponse(
        Long mechanicProfileId,
        Long accountId,
        String name,
        String email,
        String phone,
        Double serviceRadiusKm,
        String area,
        String verificationStatus,
        Boolean isAvailable,
        Integer totalJobsCompleted,
        Integer midJobCancels,
        String suspensionReason,
        String suspensionEndsAt,
        String appealStatus,
        String rejectionReason
) {}