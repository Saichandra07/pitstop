package com.pitstop.pitstop_backend.common.dto;

public record LoginResponse(String token, Long id, String name, String email) {}
