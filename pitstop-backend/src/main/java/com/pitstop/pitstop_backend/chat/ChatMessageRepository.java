package com.pitstop.pitstop_backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByJobIdOrderBySentAtAsc(Long jobId);

    boolean existsBySenderIdAndJobIdAndSentAtAfter(Long senderId, Long jobId, LocalDateTime sentAt);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.readByRecipient = true WHERE m.jobId = :jobId AND m.senderId != :readerId AND m.readByRecipient = false")
    void markAllReadForJob(@Param("jobId") Long jobId, @Param("readerId") Long readerId);
}
