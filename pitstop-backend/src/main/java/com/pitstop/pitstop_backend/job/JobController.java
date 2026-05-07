package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.job.dto.AbandonResponse;
import com.pitstop.pitstop_backend.job.dto.AdminJobResponse;
import com.pitstop.pitstop_backend.job.dto.BroadcastJobResponse;
import com.pitstop.pitstop_backend.job.dto.JobResponseDto;
import com.pitstop.pitstop_backend.job.dto.SosRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.pitstop.pitstop_backend.config.CloudinaryService;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;
    private final CloudinaryService cloudinaryService;
    private final BroadcastService broadcastService;

    public JobController(JobService jobService, CloudinaryService cloudinaryService,
                         BroadcastService broadcastService) {
        this.jobService = jobService;
        this.cloudinaryService = cloudinaryService;
        this.broadcastService = broadcastService;
    }

    // POST /api/jobs/sos — USER only (SecurityConfig)
    @PostMapping("/sos")
    public ResponseEntity<JobResponseDto> createSos(@Valid @RequestBody SosRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createSosRequest(getAccountId(), dto));
    }

    // POST /api/jobs/upload-photo — USER only, uploads image to Cloudinary
    @PostMapping("/upload-photo")
    public ResponseEntity<String> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            String url = cloudinaryService.upload(file);
            return ResponseEntity.ok(url);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Photo upload failed: " + e.getMessage());
        }
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

    // GET /api/jobs/mechanic/history — MECHANIC: their completed job history
    @GetMapping("/mechanic/history")
    public ResponseEntity<List<JobResponseDto>> getMechanicJobHistory() {
        return ResponseEntity.ok(jobService.getMechanicJobHistory(getAccountId()));
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

    @GetMapping("/admin/jobs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminJobResponse>> getAllJobsForAdmin(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(jobService.getAllJobsForAdmin(status, search));
    }

    @PostMapping("/admin/jobs/{id}/force-complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> forceComplete(@PathVariable Long id) {
        jobService.adminForceComplete(id);
        return ResponseEntity.ok().build();
    }

    // POST /api/jobs/{id}/accept — MECHANIC accepts a broadcast job
    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> acceptJob(@PathVariable Long id) {
        broadcastService.handleAccept(id, getAccountId());
        return ResponseEntity.noContent().build();
    }

    // POST /api/jobs/{id}/decline — MECHANIC declines a broadcast job
    @PostMapping("/{id}/decline")
    public ResponseEntity<Void> declineJob(@PathVariable Long id) {
        broadcastService.handleDecline(id, getAccountId());
        return ResponseEntity.noContent().build();
    }

    // POST /api/jobs/{id}/mechanic-abandon — MECHANIC abandons active job, triggers rebroadcast.
    // Returns AbandonResponse: showOffer=true → show offer screen; false → suspended.
    @PostMapping("/{id}/mechanic-abandon")
    public ResponseEntity<AbandonResponse> mechanicAbandon(@PathVariable Long id) {
        return ResponseEntity.ok(broadcastService.mechanicAbandon(id, getAccountId()));
    }

    // POST /api/jobs/{id}/mechanic-take-back — MECHANIC reclaims a job they just abandoned.
    // 200 = success; 409 = already taken by someone else.
    @PostMapping("/{id}/mechanic-take-back")
    public ResponseEntity<Void> mechanicTakeBack(@PathVariable Long id) {
        broadcastService.mechanicTakeBack(id, getAccountId());
        return ResponseEntity.ok().build();
    }

    // POST /api/jobs/{id}/mechanic-move-on — MECHANIC permanently declines the abandoned job
    // and gets notified about other nearby PENDING jobs.
    @PostMapping("/{id}/mechanic-move-on")
    public ResponseEntity<Void> mechanicMoveOn(@PathVariable Long id) {
        broadcastService.mechanicMoveOn(id, getAccountId());
        return ResponseEntity.noContent().build();
    }

    // GET /api/jobs/broadcast/pending — MECHANIC polls for all pending broadcasts (multi-SOS).
    // Always returns 200 with a list (empty = nothing pending).
    @GetMapping("/broadcast/pending")
    public ResponseEntity<List<BroadcastJobResponse>> getPendingBroadcast() {
        return ResponseEntity.ok(broadcastService.getPendingBroadcast(getAccountId()));
    }

    // JWT helper
    private Long getAccountId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}