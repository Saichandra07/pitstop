package com.pitstop.pitstop_backend.user;

public record LoginResponse (String token, Long id, String name, String email){}
