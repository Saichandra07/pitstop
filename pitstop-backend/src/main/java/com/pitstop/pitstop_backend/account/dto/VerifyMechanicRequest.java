package com.pitstop.pitstop_backend.account.dto;

import jakarta.validation.constraints.NotNull;

public class VerifyMechanicRequest {

    @NotNull
    private String action; // "APPROVE" or "REJECT"

    private String rejectionReason; // required only when action = "REJECT"

    public String getAction() { return action; }
    public String getRejectionReason() { return rejectionReason; }

    public void setAction(String action) { this.action = action; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}