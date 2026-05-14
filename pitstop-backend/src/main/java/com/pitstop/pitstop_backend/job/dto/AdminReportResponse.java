package com.pitstop.pitstop_backend.job.dto;

public record AdminReportResponse(
        Long id,
        Long jobId,
        String reporterName,
        String mechanicName,
        String reason,
        String description,
        String status,
        String createdAt
) {}
