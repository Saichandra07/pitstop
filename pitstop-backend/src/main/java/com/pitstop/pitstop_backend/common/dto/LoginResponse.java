package com.pitstop.pitstop_backend.common.dto;

import com.pitstop.pitstop_backend.account.Role;

import com.pitstop.pitstop_backend.account.VerificationStatus;

public record LoginResponse(String token, Long id, String name, String email, Role role, VerificationStatus verificationStatus) {}