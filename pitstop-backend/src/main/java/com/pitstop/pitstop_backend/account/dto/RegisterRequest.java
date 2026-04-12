package com.pitstop.pitstop_backend.account.dto;

import com.pitstop.pitstop_backend.account.Role;

public record RegisterRequest(
        String name,
        String email,
        String password,
        Role role,        // User or Mechanic - frontend sends this based on which form they filled
        String phone,     // only required if role = MECHANIC, validated in service
        String expertise, // only required if role = MECHANIC
        Double serviceRadiusKm // only required if role = MECHANIC
) {}
