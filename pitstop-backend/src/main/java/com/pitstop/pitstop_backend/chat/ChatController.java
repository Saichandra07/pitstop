package com.pitstop.pitstop_backend.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // ── WebSocket: send a message ─────────────────────────────────────────────
    // Client publishes to /app/jobs/{jobId}/chat
    // Server saves and broadcasts back to /topic/job/{jobId}/chat
    @MessageMapping("/jobs/{jobId}/chat")
    public void handleChat(
            @DestinationVariable Long jobId,
            @Payload IncomingChatMessage incoming,
            SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> attrs = headerAccessor.getSessionAttributes();
        if (attrs == null) return;
        Long senderId = (Long) attrs.get("accountId");
        String senderRole = (String) attrs.get("role");
        if (senderId == null || senderRole == null || incoming.body() == null || incoming.body().isBlank()) return;
        chatService.sendMessage(jobId, senderId, senderRole, incoming.body());
    }

    // ── REST: fetch message history ───────────────────────────────────────────
    @GetMapping("/{jobId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getHistory(@PathVariable Long jobId) {
        return ResponseEntity.ok(chatService.getHistory(jobId, getAccountId()));
    }

    // ── REST: mark all incoming messages as read ──────────────────────────────
    @PostMapping("/{jobId}/messages/read")
    public ResponseEntity<Void> markRead(@PathVariable Long jobId) {
        chatService.markRead(jobId, getAccountId());
        return ResponseEntity.ok().build();
    }

    private Long getAccountId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
