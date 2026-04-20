// account/dto/RegisterRequest.java
package com.pitstop.pitstop_backend.account.dto;

import com.pitstop.pitstop_backend.account.Role;

public record RegisterRequest(
        String name,
        String email,
        String password,
        Role role,
        String phone,
        Double serviceRadiusKm,
        ExpertiseRequest expertise  // null for USER, required for MECHANIC — validated in service
) {}