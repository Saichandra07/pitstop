package com.pitstop.pitstop_backend.account.dto;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        Integer sosCancelCount,
        String sosTimeoutUntil,
        Boolean isBanned,
        String createdAt
) {}