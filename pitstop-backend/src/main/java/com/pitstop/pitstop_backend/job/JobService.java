package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.account.*;
import com.pitstop.pitstop_backend.config.WebSocketEventPublisher;
import com.pitstop.pitstop_backend.exception.ResourceNotFoundException;
import com.pitstop.pitstop_backend.job.dto.AdminJobResponse;
import com.pitstop.pitstop_backend.job.dto.JobResponseDto;
import com.pitstop.pitstop_backend.job.dto.SosRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final MechanicProfileRepository mechanicProfileRepository;
    private final MechanicExpertiseRepository mechanicExpertiseRepository;
    private final JobBroadcastRepository jobBroadcastRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private BroadcastService broadcastService;
    @Autowired
    private WebSocketEventPublisher wsPublisher;

    public JobService(JobRepository jobRepository,
                      MechanicProfileRepository mechanicProfileRepository,
                      MechanicExpertiseRepository mechanicExpertiseRepository,
                      JobBroadcastRepository jobBroadcastRepository) {
        this.jobRepository = jobRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
        this.mechanicExpertiseRepository = mechanicExpertiseRepository;
        this.jobBroadcastRepository = jobBroadcastRepository;
    }

    // ── Mapping ────────────────────────────────────────────────────────────────

    private JobResponseDto toDto(Job job) {
        String mechanicName = null;
        String mechanicPhone = null;
        Double mechanicRating = null;
        Integer mechanicReviewCount = null;

        if (job.getMechanicProfileId() != null) {
            MechanicProfile mp = mechanicProfileRepository
                    .findById(job.getMechanicProfileId()).orElse(null);
            if (mp != null) {
                mechanicName        = mp.getAccount().getName();
                mechanicPhone       = mp.getPhone();
                mechanicRating      = mp.getAverageRating();
                mechanicReviewCount = mp.getReviewCount();
            }
        }

        String userName = accountRepository.findById(job.getAccountId())
                .map(Account::getName).orElse(null);

        return new JobResponseDto(
                job.getId(),
                job.getAccountId(),
                job.getMechanicProfileId(),
                job.getStatus(),
                job.getVehicleType(),
                job.getProblemType(),
                job.getVehicleName(),
                job.getPhotoUrl(),
                job.getAddress(),
                job.getDescription(),
                job.getLatitude(),
                job.getLongitude(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.getBroadcastRing(),
                job.getCancellationReason(),
                mechanicName,
                mechanicPhone,
                mechanicRating,
                mechanicReviewCount,
                userName
        );
    }

    // ── SOS / Create ───────────────────────────────────────────────────────────

    public JobResponseDto createSosRequest(Long accountId, SosRequestDto dto) {

        // Issue #7 — one active SOS rule
        // A user cannot have more than one live job at a time.
        // "Live" = PENDING, ACCEPTED, or IN_PROGRESS.
        boolean hasActiveJob = jobRepository.existsByAccountIdAndStatusIn(
                accountId,
                List.of(JobStatus.PENDING, JobStatus.ACCEPTED, JobStatus.IN_PROGRESS)
        );
        if (hasActiveJob) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have an active job. Cancel it before submitting a new SOS.");
        }

        Job job = new Job();
        job.setAccountId(accountId);
        job.setVehicleType(dto.getVehicleType());
        job.setProblemType(dto.getProblemType());
        job.setVehicleName(dto.getVehicleName());              // new
        job.setDescription(dto.getDescription());
        job.setLatitude(dto.getLatitude());
        job.setLongitude(dto.getLongitude());
        job.setAddress(dto.getAddress());
        job.setPhotoUrl(dto.getPhotoUrl());
        job.setStatus(JobStatus.PENDING);
        job.setBroadcastRing(1);
        job.setBroadcastStartedAt(java.time.LocalDateTime.now());
        Job saved = jobRepository.save(job);
        // Fire ring 1 broadcast immediately — scheduler only handles ring advancement
        broadcastService.broadcastToRing(saved);
        return toDto(saved);
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    // ADMIN only — full job list
    public List<JobResponseDto> getAllJobs() {
        return jobRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }
    public List<AdminJobResponse> getAllJobsForAdmin(String status, String search) {
        List<Job> jobs;

        if (search != null && !search.isBlank()) {
            jobs = jobRepository.searchByUserNameOrArea(search);
        } else if (status != null && !status.isBlank()) {
            jobs = jobRepository.findByStatusOrderByCreatedAtDesc(JobStatus.valueOf(status));
        } else {
            jobs = jobRepository.findAllByOrderByCreatedAtDesc();
        }

        return jobs.stream().map(j -> {
            String userName = accountRepository.findById(j.getAccountId())
                    .map(Account::getName).orElse("Unknown");
            String mechanicName = null;
            if (j.getMechanicProfileId() != null) {
                mechanicName = mechanicProfileRepository.findById(j.getMechanicProfileId())
                        .map(mp -> mp.getAccount().getName()).orElse(null);
            }
            return new AdminJobResponse(
                    j.getId(),
                    userName,
                    mechanicName,
                    j.getVehicleType().name(),
                    j.getProblemType().name(),
                    j.getVehicleName(),
                    j.getArea(),
                    j.getStatus().name(),
                    j.getBroadcastRing(),
                    j.getCreatedAt().toString(),
                    j.getUpdatedAt() != null ? j.getUpdatedAt().toString() : j.getCreatedAt().toString()
            );
        }).collect(Collectors.toList());
    }

    public void adminForceComplete(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job already closed");
        }
        job.setStatus(JobStatus.COMPLETED);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);

        // auto online the mechanic if one was assigned
        if (job.getMechanicProfileId() != null) {
            mechanicProfileRepository.findById(job.getMechanicProfileId()).ifPresent(mp -> {
                mp.setIsAvailable(true);
                mechanicProfileRepository.save(mp);
            });
        }
    }

    public JobResponseDto getJobById(Long id) {
        return toDto(findJobOrThrow(id));
    }

    // Issue #9 — user sees only their live jobs on dashboard
    public List<JobResponseDto> getActiveJobs(Long accountId) {
        return jobRepository.findByAccountIdAndStatusIn(
                        accountId,
                        List.of(JobStatus.PENDING, JobStatus.ACCEPTED,
                                JobStatus.ARRIVAL_REQUESTED, JobStatus.IN_PROGRESS,
                                JobStatus.COMPLETION_REQUESTED))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // Issue #10 — user history: completed + cancelled, newest first
    public List<JobResponseDto> getJobHistory(Long accountId) {
        return jobRepository.findByAccountIdAndStatusInOrderByCreatedAtDesc(
                        accountId,
                        List.of(JobStatus.COMPLETED, JobStatus.CANCELLED))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<JobResponseDto> getPendingJobs(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No mechanic profile found"));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your profile is not verified. You cannot view jobs.");
        }

        return jobRepository.findByStatus(JobStatus.PENDING)
                .stream()
                .filter(job -> mechanicExpertiseRepository
                        .existsByMechanicProfileIdAndWheelerTypeAndProblemType(
                                profile.getId(),
                                job.getVehicleType(),
                                job.getProblemType()
                        ))
                // Exclude jobs this mechanic has already received a broadcast for (including abandoned ones).
                .filter(job -> !jobBroadcastRepository.existsByJobIdAndMechanicProfileId(
                        job.getId(), profile.getId()
                ))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<JobResponseDto> getJobsByMechanic(Long mechanicProfileId) {
        return jobRepository.findByMechanicProfileId(mechanicProfileId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // Mechanic's own completed job history, newest first
    public List<JobResponseDto> getMechanicJobHistory(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No mechanic profile found"));
        return jobRepository.findByMechanicProfileIdAndStatusInOrderByCreatedAtDesc(
                        profile.getId(), List.of(JobStatus.COMPLETED))
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // GET /api/jobs/mechanic/active — mechanic's current active job
    public Optional<JobResponseDto> getMechanicActiveJob(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile found"));

        return jobRepository.findByMechanicProfileIdAndStatusIn(
                        profile.getId(),
                        List.of(JobStatus.ACCEPTED, JobStatus.ARRIVAL_REQUESTED,
                                JobStatus.IN_PROGRESS, JobStatus.COMPLETION_REQUESTED))
                .stream().map(this::toDto).findFirst();
    }

    // ── Assignment ─────────────────────────────────────────────────────────────

    // Issue #1, #4, #6 — mechanic accepts a PENDING job
    // mechanicProfileId comes from JWT (accountId → look up mechanic_profile)
    public JobResponseDto assignMechanic(Long jobId, Long accountId) {

        // Resolve mechanic profile from accountId
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No mechanic profile found for this account"));

        // Issue #4 — only VERIFIED mechanics can accept jobs
        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your profile is not verified. You cannot accept jobs.");
        }

        // Issue #4 — mechanic must be online
        if (!profile.getIsAvailable()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are marked as unavailable. Go online before accepting jobs.");
        }

        // Fetch job — must be PENDING to be assignable
        Job job = jobRepository.findByIdAndStatus(jobId, JobStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Job is no longer available"));

        // Issue #6 — set mechanicProfileId (was always null before)
        job.setMechanicProfileId(profile.getId());
        job.setStatus(JobStatus.ACCEPTED);

        JobResponseDto dto = toDto(jobRepository.save(job));
        wsPublisher.publishJobUpdate(job.getAccountId(), profile.getAccount().getId(), dto);
        return dto;
    }

    // ── Status Transitions ─────────────────────────────────────────────────────

    // Issue #8 — fixed cancel rules
    // PENDING → CANCELLED : free, no questions asked
    // ACCEPTED → CANCELLED : allowed (frontend warns the user first)
    // IN_PROGRESS → CANCELLED : blocked, work has already started
    public JobResponseDto cancelJob(Long jobId, Long accountId) {
        Job job = findJobOrThrow(jobId);

        if (!job.getAccountId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't own this job");
        }

        if (job.getStatus() == JobStatus.IN_PROGRESS ||
                job.getStatus() == JobStatus.COMPLETION_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot cancel a job that is already in progress");
        }

        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Job is already " + job.getStatus());
        }

        // Collect mechanics who currently have SENT broadcasts for this job BEFORE expiring.
        // For PENDING jobs these are the mechanics seeing this job in their BroadcastOverlay —
        // they need a WS ping so their poll() fires immediately and their overlay clears.
        List<Long> broadcastMechanicProfileIds = (job.getStatus() == JobStatus.PENDING)
                ? jobBroadcastRepository.findByJobIdAndStatus(jobId, JobBroadcastStatus.SENT)
                        .stream().map(JobBroadcast::getMechanicProfileId).collect(Collectors.toList())
                : List.of();

        // Expire any SENT broadcasts so mechanics stop seeing this job immediately
        jobBroadcastRepository.expireAllSentForJob(jobId);

        job.setCancellationReason(CancellationReason.USER_CANCELLED);
        job.setStatus(JobStatus.CANCELLED);
        jobRepository.save(job);

        // If a mechanic was already assigned, automatically bring them back online
        // using the location snapshot saved at accept time.
        Long mechanicAccountId = null;
        if (job.getMechanicProfileId() != null) {
            MechanicProfile mp = mechanicProfileRepository.findById(job.getMechanicProfileId()).orElse(null);
            if (mp != null) {
                mp.setIsAvailable(true);
                mp.setLatitude(mp.getLastKnownLatitude());
                mp.setLongitude(mp.getLastKnownLongitude());
                mechanicProfileRepository.save(mp);
                mechanicAccountId = mp.getAccount().getId();
            }
        }

        JobResponseDto dto = toDto(jobRepository.findById(job.getId()).orElse(job));
        // Notify the user (always) and assigned mechanic if any (ACCEPTED cancellation)
        wsPublisher.publishJobUpdate(job.getAccountId(), mechanicAccountId, dto);

        // For PENDING cancellation: ping every mechanic who had this job in their overlay.
        // Their poll() fires immediately, gets empty list, and cancel detection clears the card.
        for (Long profileId : broadcastMechanicProfileIds) {
            Long mechAccId = mechAccountId(profileId);
            if (mechAccId != null) {
                wsPublisher.publishBroadcast(mechAccId, java.util.Map.of("type", "BROADCAST_CANCELLED"));
            }
        }

        return dto;
    }

    // Issue #11 — mechanic ownership check added
    // Only the assigned mechanic can push status forward
    public JobResponseDto updateStatus(Long jobId, Long accountId, JobStatus newStatus) {
        Job job = findJobOrThrow(jobId);

        // Resolve the calling mechanic's profile
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No mechanic profile found"));

        // Mechanic must own this job
        if (!profile.getId().equals(job.getMechanicProfileId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not assigned to this job");
        }

        JobStatus current = job.getStatus();
        // Mechanic pushes to the _REQUESTED states; user confirms or rejects from there.
        boolean valid = switch (current) {
            case ACCEPTED    -> newStatus == JobStatus.ARRIVAL_REQUESTED;
            case IN_PROGRESS -> newStatus == JobStatus.COMPLETION_REQUESTED;
            default -> false;
        };

        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid transition: " + current + " → " + newStatus);
        }

        job.setStatus(newStatus);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);

        JobResponseDto dto = toDto(jobRepository.findById(job.getId()).orElse(job));
        // Mechanic triggered this — push to user so their UI updates immediately.
        wsPublisher.publishJobUpdate(job.getAccountId(), null, dto);
        return dto;
    }

    // ── Logout cleanup ─────────────────────────────────────────────────────────

    // Called when a user logs out. Cancels any live job, restores the mechanic
    // if one was assigned, and fires WS events so both sides update immediately.
    @Transactional
    public void cancelJobOnLogout(Long accountId) {
        List<Job> activeJobs = jobRepository.findByAccountIdAndStatusIn(
                accountId,
                List.of(JobStatus.PENDING, JobStatus.ACCEPTED,
                        JobStatus.ARRIVAL_REQUESTED, JobStatus.IN_PROGRESS,
                        JobStatus.COMPLETION_REQUESTED)
        );
        for (Job job : activeJobs) {
            // For PENDING jobs: collect which mechanics currently see this job in their overlay
            // BEFORE we expire the broadcasts (after = too late to query who was SENT).
            List<Long> broadcastMechanicProfileIds = (job.getStatus() == JobStatus.PENDING)
                    ? jobBroadcastRepository.findByJobIdAndStatus(job.getId(), JobBroadcastStatus.SENT)
                            .stream().map(JobBroadcast::getMechanicProfileId).collect(Collectors.toList())
                    : List.of();

            jobBroadcastRepository.expireAllSentForJob(job.getId());
            job.setStatus(JobStatus.CANCELLED);
            job.setCancellationReason(CancellationReason.USER_CANCELLED);
            jobRepository.save(job);

            // Restore mechanic online if one was assigned
            Long mechanicAccountId = null;
            if (job.getMechanicProfileId() != null) {
                MechanicProfile mp = mechanicProfileRepository.findById(job.getMechanicProfileId()).orElse(null);
                if (mp != null) {
                    mp.setIsAvailable(true);
                    mp.setLatitude(mp.getLastKnownLatitude());
                    mp.setLongitude(mp.getLastKnownLongitude());
                    mechanicProfileRepository.save(mp);
                    mechanicAccountId = mp.getAccount().getId();
                }
            }

            JobResponseDto dto = toDto(jobRepository.findById(job.getId()).orElse(job));
            // Push CANCELLED status to user (always) and assigned mechanic if any
            wsPublisher.publishJobUpdate(job.getAccountId(), mechanicAccountId, dto);

            // For PENDING: ping every mechanic who had this job in their broadcast overlay
            for (Long profileId : broadcastMechanicProfileIds) {
                Long mechAccId = mechAccountId(profileId);
                if (mechAccId != null) {
                    wsPublisher.publishBroadcast(mechAccId, java.util.Map.of("type", "BROADCAST_CANCELLED"));
                }
            }
        }
    }

    // ── User confirmations ─────────────────────────────────────────────────────

    // User confirms mechanic has arrived: ARRIVAL_REQUESTED → IN_PROGRESS
    public JobResponseDto confirmArrival(Long jobId, Long accountId) {
        Job job = findJobOrThrow(jobId);
        if (!job.getAccountId().equals(accountId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        if (job.getStatus() != JobStatus.ARRIVAL_REQUESTED)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not awaiting arrival confirmation");
        job.setStatus(JobStatus.IN_PROGRESS);
        job.setUpdatedAt(LocalDateTime.now());
        JobResponseDto dto = toDto(jobRepository.save(job));
        // User confirmed — push to mechanic so they see IN_PROGRESS immediately.
        Long mechanicAccId = mechAccountId(job.getMechanicProfileId());
        wsPublisher.publishJobUpdate(job.getAccountId(), mechanicAccId, dto);
        return dto;
    }

    // User rejects arrival claim: ARRIVAL_REQUESTED → ACCEPTED (mechanic not close enough yet)
    public JobResponseDto rejectArrival(Long jobId, Long accountId) {
        Job job = findJobOrThrow(jobId);
        if (!job.getAccountId().equals(accountId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        if (job.getStatus() != JobStatus.ARRIVAL_REQUESTED)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not awaiting arrival confirmation");
        job.setStatus(JobStatus.ACCEPTED);
        job.setUpdatedAt(LocalDateTime.now());
        JobResponseDto dto = toDto(jobRepository.save(job));
        Long mechanicAccId = mechAccountId(job.getMechanicProfileId());
        wsPublisher.publishJobUpdate(job.getAccountId(), mechanicAccId, dto);
        return dto;
    }

    // User confirms job is done: COMPLETION_REQUESTED → COMPLETED; mechanic auto-online
    public JobResponseDto confirmComplete(Long jobId, Long accountId) {
        Job job = findJobOrThrow(jobId);
        if (!job.getAccountId().equals(accountId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        if (job.getStatus() != JobStatus.COMPLETION_REQUESTED)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not awaiting completion confirmation");
        job.setStatus(JobStatus.COMPLETED);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);

        // Restore mechanic online at last known location and notify them of nearby pending jobs
        Long mechanicAccId = null;
        if (job.getMechanicProfileId() != null) {
            MechanicProfile mp = mechanicProfileRepository.findById(job.getMechanicProfileId()).orElse(null);
            if (mp != null) {
                mp.setIsAvailable(true);
                mp.setLatitude(mp.getLastKnownLatitude());
                mp.setLongitude(mp.getLastKnownLongitude());
                mechanicProfileRepository.save(mp);
                mechanicAccId = mp.getAccount().getId();
                if (mp.getLatitude() != null && mp.getLongitude() != null) {
                    broadcastService.notifyNewlyOnlineMechanic(mp);
                }
            }
        }
        JobResponseDto dto = toDto(jobRepository.findById(jobId).orElse(job));
        // User confirmed completion — push to mechanic so they see COMPLETED immediately.
        wsPublisher.publishJobUpdate(job.getAccountId(), mechanicAccId, dto);
        return dto;
    }

    // User rejects completion claim: COMPLETION_REQUESTED → IN_PROGRESS (work not done yet)
    public JobResponseDto rejectComplete(Long jobId, Long accountId) {
        Job job = findJobOrThrow(jobId);
        if (!job.getAccountId().equals(accountId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        if (job.getStatus() != JobStatus.COMPLETION_REQUESTED)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not awaiting completion confirmation");
        job.setStatus(JobStatus.IN_PROGRESS);
        job.setUpdatedAt(LocalDateTime.now());
        JobResponseDto dto = toDto(jobRepository.save(job));
        Long mechanicAccId = mechAccountId(job.getMechanicProfileId());
        wsPublisher.publishJobUpdate(job.getAccountId(), mechanicAccId, dto);
        return dto;
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public void deleteJob(Long id) {
        jobRepository.delete(findJobOrThrow(id));
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private Job findJobOrThrow(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id " + id));
    }

    // Resolves the accountId of the mechanic assigned to a job (for WS topic routing).
    private Long mechAccountId(Long mechanicProfileId) {
        if (mechanicProfileId == null) return null;
        return mechanicProfileRepository.findById(mechanicProfileId)
                .map(mp -> mp.getAccount().getId())
                .orElse(null);
    }
}