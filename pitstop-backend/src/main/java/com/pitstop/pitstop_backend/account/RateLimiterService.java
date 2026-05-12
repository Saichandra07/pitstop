package com.pitstop.pitstop_backend.account;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiterService {

    private final ConcurrentHashMap<String, List<LocalDateTime>> attempts = new ConcurrentHashMap<>();

    // Throws 429 if the key has exceeded maxCalls within the last windowMinutes.
    // Records the current attempt on every non-rejected call.
    public void checkAndRecord(String key, int maxCalls, int windowMinutes) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusMinutes(windowMinutes);

        List<LocalDateTime> list = attempts.computeIfAbsent(key, k -> new ArrayList<>());
        synchronized (list) {
            list.removeIf(t -> t.isBefore(windowStart));
            if (list.size() >= maxCalls) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many requests. Please try again later.");
            }
            list.add(now);
        }
    }
}
