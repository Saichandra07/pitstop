package com.pitstop.pitstop_backend.chat;

import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.config.WebSocketEventPublisher;
import com.pitstop.pitstop_backend.job.Job;
import com.pitstop.pitstop_backend.job.JobRepository;
import com.pitstop.pitstop_backend.job.JobStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final JobRepository jobRepository;
    private final MechanicProfileRepository mechanicProfileRepository;
    private final WebSocketEventPublisher wsPublisher;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       JobRepository jobRepository,
                       MechanicProfileRepository mechanicProfileRepository,
                       WebSocketEventPublisher wsPublisher) {
        this.chatMessageRepository = chatMessageRepository;
        this.jobRepository = jobRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
        this.wsPublisher = wsPublisher;
    }

    @Transactional
    public ChatMessageDto sendMessage(Long jobId, Long senderId, String senderRole, String body) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() != JobStatus.ACCEPTED
                && job.getStatus() != JobStatus.IN_PROGRESS
                && job.getStatus() != JobStatus.ARRIVAL_REQUESTED
                && job.getStatus() != JobStatus.COMPLETION_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chat not available for this job");
        }

        validateParticipant(job, senderId);

        ChatMessage msg = new ChatMessage();
        msg.setJobId(jobId);
        msg.setSenderId(senderId);
        msg.setSenderRole(senderRole);
        msg.setBody(body.trim());
        chatMessageRepository.save(msg);

        ChatMessageDto dto = toDto(msg);
        wsPublisher.publishChatMessage(jobId, dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getHistory(Long jobId, Long requesterId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        validateParticipant(job, requesterId);
        return chatMessageRepository.findByJobIdOrderBySentAtAsc(jobId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void markRead(Long jobId, Long readerId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        validateParticipant(job, readerId);
        chatMessageRepository.markAllReadForJob(jobId, readerId);
    }

    private void validateParticipant(Job job, Long accountId) {
        boolean isUser = job.getAccountId().equals(accountId);
        boolean isMechanic = job.getMechanicProfileId() != null
                && mechanicProfileRepository.findById(job.getMechanicProfileId())
                        .map(mp -> accountId.equals(mp.getAccount().getId()))
                        .orElse(false);
        if (!isUser && !isMechanic) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant in this job");
        }
    }

    private ChatMessageDto toDto(ChatMessage m) {
        return new ChatMessageDto(
                m.getId(), m.getJobId(), m.getSenderId(), m.getSenderRole(),
                m.getBody(), m.getSentAt().toString(), m.getReadByRecipient());
    }
}
