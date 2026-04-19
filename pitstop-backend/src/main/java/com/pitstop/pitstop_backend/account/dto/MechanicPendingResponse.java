package com.pitstop.pitstop_backend.account.dto;

import java.time.LocalDateTime;

public class MechanicPendingResponse {

    private Long id;              // mechanic_profile.id — used for approve/reject calls
    private Long accountId;
    private String name;
    private String email;
    private String phone;
    private Double serviceRadiusKm;
    private LocalDateTime createdAt;

    public MechanicPendingResponse(Long id, Long accountId, String name, String email,
                                   String phone, Double serviceRadiusKm, LocalDateTime createdAt) {
        this.id = id;
        this.accountId = accountId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.serviceRadiusKm = serviceRadiusKm;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getAccountId() { return accountId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public Double getServiceRadiusKm() { return serviceRadiusKm; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}