package com.pitstop.pitstop_backend.config;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class WebSocketEventPublisher {

    private final SimpMessagingTemplate template;

    public WebSocketEventPublisher(SimpMessagingTemplate template) {
        this.template = template;
    }

    // Publish a job status update to both sides of the job.
    // mechanicAccountId may be null if no mechanic is assigned yet.
    public void publishJobUpdate(Long userAccountId, Long mechanicAccountId, Object payload) {
        afterCommitOrNow(() -> {
            template.convertAndSend("/topic/account/" + userAccountId + "/job-update", payload);
            if (mechanicAccountId != null) {
                template.convertAndSend("/topic/account/" + mechanicAccountId + "/job-update", payload);
            }
        });
    }

    // Push a chat message to both sides of the job.
    public void publishChatMessage(Long jobId, Object payload) {
        afterCommitOrNow(() ->
            template.convertAndSend("/topic/job/" + jobId + "/chat", payload)
        );
    }

    // Push a broadcast notification to a single mechanic.
    // Payload is intentionally minimal — frontend calls poll() on receipt.
    public void publishBroadcast(Long mechanicAccountId, Object payload) {
        afterCommitOrNow(() ->
            template.convertAndSend("/topic/account/" + mechanicAccountId + "/broadcast", payload)
        );
    }

    // Defers the action to run after the current DB transaction commits.
    // If no transaction is active, runs immediately.
    // This prevents the WS event firing before the DB write is visible to readers.
    private void afterCommitOrNow(Runnable action) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
