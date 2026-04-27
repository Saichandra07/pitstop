package com.pitstop.pitstop_backend.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

public record AdminPenaltyRequest(
        @NotBlank String reason,
        @Min(1) int suspensionDays
) {}