package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.exception.ResourceNotFoundException;
import com.pitstop.pitstop_backend.job.dto.JobResponseDto;
import com.pitstop.pitstop_backend.job.dto.SosRequestDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    // ── Mapping ────────────────────────────────────────────────────────────────

    private JobResponseDto toDto(Job job) {
        return new JobResponseDto(
                job.getId(),
                job.getAccountId(),
                job.getMechanicProfileId(),
                job.getStatus(),
                job.getVehicleType(),
                job.getProblemType(),
                job.getAddress(),
                job.getDescription(),
                job.getLatitude(),
                job.getLongitude(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }

    // ── SOS / Create ───────────────────────────────────────────────────────────

    // accountId comes from JWT — never from the request body
    public JobResponseDto createSosRequest(Long accountId, SosRequestDto dto) {
        Job job = new Job();
        job.setAccountId(accountId);
        job.setVehicleType(dto.getVehicleType());
        job.setProblemType(dto.getProblemType());
        job.setDescription(dto.getDescription());
        job.setLatitude(dto.getLatitude());
        job.setLongitude(dto.getLongitude());
        job.setAddress(dto.getAddress());
        job.setStatus(JobStatus.PENDING);
        return toDto(jobRepository.save(job));
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    public List<JobResponseDto> getAllJobs() {
        return jobRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public JobResponseDto getJobById(Long id) {
        return toDto(findJobOrThrow(id));
    }

    // Only returns jobs belonging to the calling user
    public List<JobResponseDto> getMyJobs(Long accountId) {
        return jobRepository.findByAccountId(accountId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<JobResponseDto> getJobsByMechanic(Long mechanicProfileId) {
        return jobRepository.findByMechanicProfileId(mechanicProfileId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Status Transitions ─────────────────────────────────────────────────────

    // Enforces: PENDING → CANCELLED (only by the job owner)
    public JobResponseDto cancelJob(Long jobId, Long accountId) {
        Job job = findJobOrThrow(jobId);

        if (!job.getAccountId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't own this job");
        }
        if (job.getStatus() != JobStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING jobs can be cancelled");
        }

        job.setStatus(JobStatus.CANCELLED);
        return toDto(jobRepository.save(job));
    }

    // Enforces: PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
    public JobResponseDto updateStatus(Long jobId, JobStatus newStatus) {
        Job job = findJobOrThrow(jobId);
        JobStatus current = job.getStatus();

        boolean valid = switch (current) {
            case PENDING -> newStatus == JobStatus.ACCEPTED;
            case ACCEPTED -> newStatus == JobStatus.IN_PROGRESS;
            case IN_PROGRESS -> newStatus == JobStatus.COMPLETED;
            default -> false;
        };

        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid transition: " + current + " → " + newStatus);
        }

        job.setStatus(newStatus);
        return toDto(jobRepository.save(job));
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public void deleteJob(Long id) {
        jobRepository.delete(findJobOrThrow(id));
    }

    // ── Internal helper ────────────────────────────────────────────────────────

    private Job findJobOrThrow(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id " + id));
    }
}