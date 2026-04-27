package com.pitstop.pitstop_backend.account.dto;

public record AdminTimeoutRequest(
        int hours  // 0 = clear timeout
) {}