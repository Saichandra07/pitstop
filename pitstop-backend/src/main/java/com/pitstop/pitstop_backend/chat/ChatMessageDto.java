package com.pitstop.pitstop_backend.chat;

public record ChatMessageDto(
        Long id,
        Long jobId,
        Long senderId,
        String senderRole,
        String body,
        String sentAt,
        boolean readByRecipient
) {}
