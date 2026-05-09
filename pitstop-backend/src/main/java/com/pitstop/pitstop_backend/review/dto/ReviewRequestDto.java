package com.pitstop.pitstop_backend.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReviewRequestDto(
        @NotNull @Min(1) @Max(5) Integer rating,
        String comment,
        List<String> tags
) {}
