package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.job.dto.SosRequestDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public ResponseEntity<Job> createJob(@RequestParam Long userId,
                                          @RequestBody Job job){
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createJob(userId, job));
    }

    // Get /api/jobs
    @GetMapping
    public ResponseEntity<List<Job>> getAllJobs(){
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    //get /api/jobs/1
    @GetMapping("{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Long id){
        return ResponseEntity.ok(jobService.getJobById(id));
    }
    // Get /api/jobs/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Job>> getJobsByUser(@PathVariable Long userId){
        return ResponseEntity.ok(jobService.getJobsByUser(userId));
    }
    // Get /api/jobs/mechanic/1
    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<List<Job>> getJobsByMechanic(@PathVariable Long mechanicId){
        return ResponseEntity.ok(jobService.getJobsByMechanic(mechanicId));
    }

    //Patch /api/jobs/1/assign?mechanicId=2
    @PatchMapping("/{jobId}/assign")
    public ResponseEntity<Job> assignMechanic(@PathVariable Long jobId,
                                              @RequestParam Long mechanicId
                                              ){
        return ResponseEntity.ok(jobService.assignMechanic(jobId, mechanicId));
    }

    // Patch /api/jobs/1/status?status=IN_PROGRESS
    @PatchMapping("/{jobId}/status")
    public ResponseEntity<Job> updateStatus(@PathVariable Long jobId, @RequestParam JobStatus status){
        return ResponseEntity.ok(jobService.updateStatus(jobId, status));
    }

    //Delete /api/jobs/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void>deleteJob(@PathVariable Long id){
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sos")
    public ResponseEntity<Job> createSos(@RequestBody SosRequestDto dto){
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createSosRequest(dto));
    }

}
