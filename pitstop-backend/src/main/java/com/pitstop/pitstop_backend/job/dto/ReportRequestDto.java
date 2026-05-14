package com.pitstop.pitstop_backend.job.dto;

import jakarta.validation.constraints.NotBlank;

public record ReportRequestDto(@NotBlank String reason, String description) {}
