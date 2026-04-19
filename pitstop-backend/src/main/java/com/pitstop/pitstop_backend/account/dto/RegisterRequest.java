package com.pitstop.pitstop_backend.account.dto;

import com.pitstop.pitstop_backend.account.Role;

public record RegisterRequest(
        String name,
        String email,
        String password,
        Role role,
        String phone,           // only required if role = MECHANIC, validated in service
        Double serviceRadiusKm  // only required if role = MECHANIC
) {}