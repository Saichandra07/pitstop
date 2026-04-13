package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.job.dto.JobResponseDto;
import com.pitstop.pitstop_backend.job.dto.SosRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    //POST /api/jobs/sos
    @PostMapping("/sos")
    public ResponseEntity<JobResponseDto> createSos(@Valid @RequestBody SosRequestDto dto){
        Long accountId = getAccountId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createSosRequest(accountId, dto));
    }

    //GET /api/jobs - admin use
    @GetMapping
    public ResponseEntity<List<JobResponseDto>> getAllJobs(){
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    //GET /api/jobs{id}
    @GetMapping("/{id}")
    public ResponseEntity<JobResponseDto> getJobById(@PathVariable Long id){
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    //GET /api/jobs/my - returns only the calling user's jobs
    @GetMapping("/my")
    public ResponseEntity<List<JobResponseDto>> getMyJobs(){
        return ResponseEntity.ok(jobService.getMyJobs(getAccountId()));
    }

    //GET /api/jobs/mechanic/{mechanicProfileId}
    @GetMapping("/mechanic/{mechanicProfileId}")
    public ResponseEntity<List<JobResponseDto>> getJobsByMechanic(
            @PathVariable Long mechanicProfileId){
        return ResponseEntity.ok(jobService.getJobsByMechanic(mechanicProfileId));
    }

    // PATCH /api/jobs/{jobId}/cancel
    @PatchMapping("/{jobId}/cancel")
    public ResponseEntity<JobResponseDto> cancelJob(@PathVariable Long jobId){
        return ResponseEntity.ok(jobService.cancelJob(jobId, getAccountId()));
    }

    // PATCH /api/jobs/{jobId}/status?status=IN_PROGRESS
    @PatchMapping("/{jobId}/status")
    public ResponseEntity<JobResponseDto> updateStatus(@PathVariable Long jobId,
                                                       @RequestParam JobStatus status){
        return ResponseEntity.ok(jobService.updateStatus(jobId, status));
    }

    // DELETE /api/jobs/{id}
    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id){
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    // JWT helper
    private Long getAccountId(){
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
