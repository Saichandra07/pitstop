package com.pitstop.pitstop_backend.account.dto;

import jakarta.validation.constraints.NotBlank;

public record AppealRequest(@NotBlank String reason) {}
