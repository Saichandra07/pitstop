package com.pitstop.pitstop_backend.config;

import com.pitstop.pitstop_backend.auth.JwtUtil;
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

    public WebSocketChannelInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        // ── CONNECT: validate JWT, store accountId in session ──────────────
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
            }
        }

        // ── SUBSCRIBE: enforce /topic/account/{id}/… ownership ─────────────
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String dest = accessor.getDestination();
            if (dest != null && dest.startsWith("/topic/account/")) {
                String[] parts = dest.split("/"); // ["","topic","account","{id}","event"]
                if (parts.length >= 4) {
                    try {
                        long destId = Long.parseLong(parts[3]);
                        Map<String, Object> attrs = accessor.getSessionAttributes();
                        Long sessionId = attrs != null ? (Long) attrs.get("accountId") : null;
                        if (sessionId == null || destId != sessionId) {
                            throw new MessagingException("Forbidden: cannot subscribe to another account's topic");
                        }
                    } catch (NumberFormatException e) {
                        throw new MessagingException("Invalid topic destination");
                    }
                }
            }
        }

        return message;
    }
}
