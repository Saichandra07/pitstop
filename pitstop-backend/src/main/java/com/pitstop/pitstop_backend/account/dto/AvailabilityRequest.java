package com.pitstop.pitstop_backend.account.dto;

public record AvailabilityRequest(
        Boolean isAvailable,
        Double latitude,
        Double longitude
) {}
