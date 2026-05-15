package com.pitstop.pitstop_backend.config;

import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.auth.JwtUtil;
import com.pitstop.pitstop_backend.job.JobRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final JobRepository jobRepository;
    private final MechanicProfileRepository mechanicProfileRepository;

    public WebSocketChannelInterceptor(JwtUtil jwtUtil,
                                       JobRepository jobRepository,
                                       MechanicProfileRepository mechanicProfileRepository) {
        this.jwtUtil = jwtUtil;
        this.jobRepository = jobRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        // ── CONNECT: validate JWT, store accountId + role in session ───────────
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String auth = accessor.getFirstNativeHeader("Authorization");
            if (auth == null || !auth.startsWith("Bearer ")) {
                throw new MessagingException("Missing Authorization header");
            }
            String token = auth.substring(7);
            if (!jwtUtil.isTokenValid(token)) {
                throw new MessagingException("Invalid or expired token");
            }
            Map<String, Object> attrs = accessor.getSessionAttributes();
            if (attrs != null) {
                attrs.put("accountId", jwtUtil.extractAccountId(token));
                attrs.put("role", jwtUtil.extractRole(token).name());
            }
        }

        // ── SUBSCRIBE: enforce topic ownership ─────────────────────────────────
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String dest = accessor.getDestination();
            Map<String, Object> attrs = accessor.getSessionAttributes();
            Long sessionId = attrs != null ? (Long) attrs.get("accountId") : null;

            // /topic/account/{id}/... — must match own account ID
            if (dest != null && dest.startsWith("/topic/account/")) {
                String[] parts = dest.split("/");
                if (parts.length >= 4) {
                    try {
                        long destId = Long.parseLong(parts[3]);
                        if (sessionId == null || destId != sessionId) {
                            throw new MessagingException("Forbidden: cannot subscribe to another account's topic");
                        }
                    } catch (NumberFormatException e) {
                        throw new MessagingException("Invalid topic destination");
                    }
                }
            }

            // /topic/job/{jobId}/chat — must be a participant (user or mechanic on that job)
            if (dest != null && dest.startsWith("/topic/job/") && dest.endsWith("/chat")) {
                String[] parts = dest.split("/");
                if (parts.length >= 4) {
                    try {
                        long jobId = Long.parseLong(parts[3]);
                        if (sessionId == null || !isJobParticipant(jobId, sessionId)) {
                            throw new MessagingException("Forbidden: not a participant in this job");
                        }
                    } catch (NumberFormatException e) {
                        throw new MessagingException("Invalid job chat destination");
                    }
                }
            }
        }

        return message;
    }

    private boolean isJobParticipant(long jobId, long accountId) {
        return jobRepository.findById(jobId).map(job -> {
            if (accountId == job.getAccountId()) return true;
            if (job.getMechanicProfileId() == null) return false;
            return mechanicProfileRepository.findById(job.getMechanicProfileId())
                    .map(mp -> mp.getAccount().getId() == accountId)
                    .orElse(false);
        }).orElse(false);
    }
}
