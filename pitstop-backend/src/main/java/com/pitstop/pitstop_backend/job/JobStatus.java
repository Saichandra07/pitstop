package com.pitstop.pitstop_backend.job;

public enum JobStatus {
    PENDING,
    ACCEPTED,
    ARRIVAL_REQUESTED,    // mechanic said arrived, waiting for user confirmation
    IN_PROGRESS,
    COMPLETION_REQUESTED, // mechanic said done, waiting for user confirmation
    COMPLETED,
    CANCELLED
}
