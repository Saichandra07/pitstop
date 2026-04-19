package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.job.dto.JobResponseDto;
import com.pitstop.pitstop_backend.job.dto.SosRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // POST /api/jobs/sos — USER only (SecurityConfig)
    @PostMapping("/sos")
    public ResponseEntity<JobResponseDto> createSos(@Valid @RequestBody SosRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createSosRequest(getAccountId(), dto));
    }

    // GET /api/jobs — ADMIN only (SecurityConfig)
    @GetMapping
    public ResponseEntity<List<JobResponseDto>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    // GET /api/jobs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<JobResponseDto> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    // GET /api/jobs/my/active — USER: live jobs on dashboard (issue #9)
    @GetMapping("/my/active")
    public ResponseEntity<List<JobResponseDto>> getActiveJobs() {
        return ResponseEntity.ok(jobService.getActiveJobs(getAccountId()));
    }

    // GET /api/jobs/my/history — USER: completed + cancelled (issue #10)
    @GetMapping("/my/history")
    public ResponseEntity<List<JobResponseDto>> getJobHistory() {
        return ResponseEntity.ok(jobService.getJobHistory(getAccountId()));
    }

    // GET /api/jobs/pending — MECHANIC only: broadcast feed (issue #3)
    @GetMapping("/pending")
    public ResponseEntity<List<JobResponseDto>> getPendingJobs() {
        return ResponseEntity.ok(jobService.getPendingJobs(getAccountId()));
    }

    // GET /api/jobs/mechanic/active — MECHANIC: their current active job
    @GetMapping("/mechanic/active")
    public ResponseEntity<JobResponseDto> getMechanicActiveJob() {
        return jobService.getMechanicActiveJob(getAccountId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // GET /api/jobs/mechanic/{mechanicProfileId} — MECHANIC/ADMIN
    @GetMapping("/mechanic/{mechanicProfileId}")
    public ResponseEntity<List<JobResponseDto>> getJobsByMechanic(
            @PathVariable Long mechanicProfileId) {
        return ResponseEntity.ok(jobService.getJobsByMechanic(mechanicProfileId));
    }

    // POST /api/jobs/{jobId}/assign — MECHANIC accepts a PENDING job (issue #1)
    @PostMapping("/{jobId}/assign")
    public ResponseEntity<JobResponseDto> assignMechanic(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.assignMechanic(jobId, getAccountId()));
    }

    // PATCH /api/jobs/{jobId}/cancel — USER cancels their own job (issue #8)
    @PatchMapping("/{jobId}/cancel")
    public ResponseEntity<JobResponseDto> cancelJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.cancelJob(jobId, getAccountId()));
    }

    // PATCH /api/jobs/{jobId}/status?status=IN_PROGRESS — MECHANIC only (issue #11)
    @PatchMapping("/{jobId}/status")
    public ResponseEntity<JobResponseDto> updateStatus(@PathVariable Long jobId,
                                                       @RequestParam JobStatus status) {
        return ResponseEntity.ok(jobService.updateStatus(jobId, getAccountId(), status));
    }

    // DELETE /api/jobs/{id} — ADMIN only (SecurityConfig)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    // JWT helper
    private Long getAccountId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}