package com.pitstop.pitstop_backend.account;

import com.pitstop.pitstop_backend.account.dto.*;
import com.pitstop.pitstop_backend.account.dto.AvailabilityRequest;
import com.pitstop.pitstop_backend.auth.JwtUtil;
import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import com.pitstop.pitstop_backend.config.CloudinaryService;
import com.pitstop.pitstop_backend.config.GeocodingService;
import com.pitstop.pitstop_backend.exception.ResourceNotFoundException;
import com.pitstop.pitstop_backend.job.BroadcastService;
import com.pitstop.pitstop_backend.job.JobRepository;
import com.pitstop.pitstop_backend.job.JobStatus;
import com.pitstop.pitstop_backend.job.ProblemType;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.pitstop.pitstop_backend.account.dto.MechanicPendingResponse;
import com.pitstop.pitstop_backend.account.dto.VerifyMechanicRequest;
import com.pitstop.pitstop_backend.account.RejectionReason;
import com.pitstop.pitstop_backend.account.AppealStatus;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private  final MechanicProfileRepository mechanicProfileRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RejectionReasonRepository rejectionReasonRepository;
    private final MechanicExpertiseRepository mechanicExpertiseRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailService emailService;
    private final JobRepository jobRepository;
    private final RateLimiterService rateLimiterService;
    private final CloudinaryService cloudinaryService;

    @org.springframework.beans.factory.annotation.Autowired
    private BroadcastService broadcastService;

    @org.springframework.beans.factory.annotation.Autowired
    private GeocodingService geocodingService;

    public AccountService(
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            MechanicProfileRepository mechanicProfileRepository,
            MechanicExpertiseRepository mechanicExpertiseRepository,
            RejectionReasonRepository rejectionReasonRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            EmailService emailService,
            JobRepository jobRepository,
            RateLimiterService rateLimiterService,
            CloudinaryService cloudinaryService
            ) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mechanicProfileRepository = mechanicProfileRepository;
        this.mechanicExpertiseRepository = mechanicExpertiseRepository;
        this.rejectionReasonRepository = rejectionReasonRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.emailService = emailService;
        this.jobRepository = jobRepository;
        this.rateLimiterService = rateLimiterService;
        this.cloudinaryService = cloudinaryService;
    }


    public LoginResponse register(RegisterRequest request, String clientIp) {
        rateLimiterService.checkAndRecord(clientIp + ":register", 3, 60);

        if (accountRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already registered");
        }

        if (request.role() == Role.MECHANIC) {
            if (request.phone() == null || request.phone().isBlank()) {
                throw new RuntimeException("Phone number is required for mechanic registration");
            }
            if (request.serviceRadiusKm() == null) {
                throw new RuntimeException("Service radius is required for mechanic");
            }
        }

        Account account = new Account();
        account.setEmail(request.email());
        account.setName(request.name());
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRole(request.role());

        Account saved = accountRepository.save(account);
        sendVerificationEmail(saved.getId(), saved.getEmail());

        if (request.role() == Role.MECHANIC) {
            MechanicProfile profile = new MechanicProfile();
            profile.setAccount(saved);
            profile.setPhone(request.phone());
            profile.setServiceRadiusKm(request.serviceRadiusKm());
            profile.setVerificationStatus(VerificationStatus.PENDING);
            mechanicProfileRepository.save(profile);
            // expertise saved separately via PATCH /accounts/expertise in onboarding step 3
        }

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getId(), saved.getRole());
        VerificationStatus verificationStatus = request.role() == Role.MECHANIC
                ? VerificationStatus.PENDING : null;
        return new LoginResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), verificationStatus);
    }

    // Reusable — called from register() and setExpertise()
    private void saveExpertiseRows(Long mechanicProfileId, ExpertiseRequest expertiseRequest) {
        for (ExpertiseRequest.WheelerExpertise entry : expertiseRequest.expertise()) {
            for (ProblemType problem : entry.problemTypes()) {
                MechanicExpertise expertise = new MechanicExpertise();
                expertise.setMechanicProfileId(mechanicProfileId);
                expertise.setWheelerType(entry.wheelerType());
                expertise.setProblemType(problem);
                // jobsCompleted defaults to 0 in the entity — no need to set it
                mechanicExpertiseRepository.save(expertise);
            }
        }
    }

    // Called from PATCH /accounts/expertise
    public void setExpertise(Long mechanicProfileId, ExpertiseRequest request) {
        // Wipe all existing rows for this mechanic, then re-insert clean
        mechanicExpertiseRepository.deleteAllByMechanicProfileId(mechanicProfileId);
        saveExpertiseRows(mechanicProfileId, request);
    }

    public LoginResponse login(LoginRequest request, String clientIp) {
        // fetch account by email — if not found, don't reveal whether email exists
        Account account = accountRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (Boolean.TRUE.equals(account.getIsBanned())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been banned");
        }

        if (!account.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Please verify your email address. Check your inbox for the verification link.");
        }

        //BCrypt compare - reject wrong passwords; only failed attempts count toward the rate limit
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            rateLimiterService.checkAndRecord(clientIp + ":login", 5, 15);
            throw new RuntimeException("Invalid credentials");
        }

        // same error message for both "email not found" and "wrong password"
        // this is intentional — prevents email enumeration attacks

        String token = jwtUtil.generateToken(account.getEmail(), account.getId(), account.getRole());
        VerificationStatus verificationStatus = account.getRole() == Role.MECHANIC
                ? mechanicProfileRepository.findByAccountId(account.getId())
                .map(MechanicProfile::getVerificationStatus)
                .orElse(null)
                : null;
        return new LoginResponse(token, account.getId(), account.getName(), account.getEmail(), account.getRole(), verificationStatus);

    }

    // Mechanic toggles availability. Lat/lng required when going online — stored for broadcast ring queries.
    public void toggleAvailability(Long accountId, AvailabilityRequest request) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only verified mechanics can change availability");
        }

        if (profile.getLastAvailabilityToggleAt() != null) {
            long elapsed = Duration.between(profile.getLastAvailabilityToggleAt(), LocalDateTime.now()).toSeconds();
            if (elapsed < 10) {
                long remaining = 10 - elapsed;
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Please wait " + remaining + " more second" + (remaining == 1 ? "" : "s") + " before toggling again");
            }
        }
        profile.setLastAvailabilityToggleAt(LocalDateTime.now());

        boolean goingOnline = Boolean.TRUE.equals(request.isAvailable());

        if (!goingOnline) {
            boolean hasActiveJob = jobRepository.existsByMechanicProfileIdAndStatusIn(
                    profile.getId(),
                    List.of(JobStatus.ACCEPTED, JobStatus.IN_PROGRESS)
            );
            if (hasActiveJob) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Cannot go offline during an active job");
            }
            profile.setLatitude(null);
            profile.setLongitude(null);
        } else {
            if (request.latitude() == null || request.longitude() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Location is required to go online");
            }
            profile.setLatitude(request.latitude());
            profile.setLongitude(request.longitude());
        }

        profile.setIsAvailable(goingOnline);
        mechanicProfileRepository.save(profile);

        if (goingOnline) {
            final Long profileId = profile.getId();
            final double lat = request.latitude();
            final double lng = request.longitude();
            CompletableFuture.runAsync(() -> {
                String area = geocodingService.reverseGeocode(lat, lng);
                mechanicProfileRepository.findById(profileId).ifPresent(p -> {
                    p.setArea(area);
                    mechanicProfileRepository.save(p);
                });
            });
            broadcastService.notifyNewlyOnlineMechanic(profile);
        }
    }

    public LoginResponse setupAdmin(AdminSetupRequest request) {
        // Permanently sealed — if any admin exists, reject forever
        boolean adminExists = accountRepository.existsByRole(Role.ADMIN);
        if (adminExists) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin already exists");
        }

        // Create the admin account
        Account admin = new Account();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        admin.setRole(Role.ADMIN);

        accountRepository.save(admin);

        // Generate JWT and return LoginResponse
        String token = jwtUtil.generateToken(admin.getEmail(), admin.getId(), admin.getRole());

        return new LoginResponse(
                token,
                admin.getId(),
                admin.getName(),
                admin.getEmail(),
                admin.getRole(),
                null
        );
    }

    public List<MechanicPendingResponse> getPendingMechanics() {
        List<MechanicProfile> pending = mechanicProfileRepository
                .findByVerificationStatus(VerificationStatus.PENDING);

        return pending.stream().map(mp -> new MechanicPendingResponse(
                mp.getId(),
                mp.getAccount().getId(),
                mp.getAccount().getName(),
                mp.getAccount().getEmail(),
                mp.getPhone(),
                mp.getServiceRadiusKm(),
                mp.getAccount().getCreatedAt()
        )).toList();
    }

    public void verifyMechanic(Long mechanicProfileId, VerifyMechanicRequest request) {
        MechanicProfile profile = mechanicProfileRepository.findById(mechanicProfileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mechanic not found"));

        String action = request.getAction();

        if (action.equals("APPROVE")) {
            profile.setVerificationStatus(VerificationStatus.VERIFIED);
            profile.setRejectionReason(null);
        } else if (action.equals("REJECT")) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason required");
            }
            profile.setVerificationStatus(VerificationStatus.REJECTED);
            profile.setRejectionReason(request.getRejectionReason());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action. Use APPROVE or REJECT");
        }

        mechanicProfileRepository.save(profile);
    }

    public List<RejectionReason> getRejectionReasons() {
        return rejectionReasonRepository.findAll();
    }

    public RejectionReason addRejectionReason(String reason) {
        RejectionReason rr = new RejectionReason();
        rr.setReason(reason);
        return rejectionReasonRepository.save(rr);
    }

    public void deleteRejectionReason(Long id) {
        if (!rejectionReasonRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reason not found");
        }
        rejectionReasonRepository.deleteById(id);
    }

    // Called from PATCH /accounts/expertise
    public void updateExpertise(Long accountId, ExpertiseRequest request) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new RuntimeException("Mechanic profile not found"));
        setExpertise(profile.getId(), request);
    }

    public AccountMeResponse getMe(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        if (account.getRole() == Role.MECHANIC) {
            MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mechanic profile not found"));

            // Check if this mechanic has completed expertise selection
            boolean hasExpertise = mechanicExpertiseRepository
                    .existsByMechanicProfileId(profile.getId());

            return new AccountMeResponse(
                    account.getId(),
                    account.getName(),
                    account.getEmail(),
                    account.getRole().name(),
                    profile.getVerificationStatus(),
                    profile.getIsAvailable(),
                    profile.getRejectionReason(),
                    hasExpertise,
                    profile.getAverageRating(),
                    profile.getReviewCount(),
                    profile.getTotalJobsCompleted(),
                    account.getProfilePhotoUrl(),
                    profile.getAppealStatus() != null ? profile.getAppealStatus().name() : null
            );
        }

        return new AccountMeResponse(
                account.getId(),
                account.getName(),
                account.getEmail(),
                account.getRole().name(),
                null, null, null, null, null, null, null, null, null  // USER — no mechanic fields
        );
    }

    public void forgotPassword(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found with that email"));

        LocalDateTime now = LocalDateTime.now();
        if (account.getLastPasswordResetRequestAt() != null &&
                Duration.between(account.getLastPasswordResetRequestAt(), now).toSeconds() < 60) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait a minute before requesting another reset link.");
        }
        account.setLastPasswordResetRequestAt(now);
        accountRepository.save(account);

        passwordResetTokenRepository.deleteAllByAccountId(account.getId());

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);
        passwordResetTokenRepository.save(new PasswordResetToken(token, account.getId(), expiresAt));

        emailService.sendPasswordResetEmail(email, token);
    }

    public LoginResponse resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link"));

        if (resetToken.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This reset link has already been used");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset link has expired. Please request a new one");
        }

        Account account = accountRepository.findById(resetToken.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        accountRepository.save(account);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        String jwt = jwtUtil.generateToken(account.getEmail(), account.getId(), account.getRole());
        MechanicProfile profile = account.getRole() == Role.MECHANIC
                ? mechanicProfileRepository.findByAccountId(account.getId()).orElse(null)
                : null;
        VerificationStatus vs = profile != null ? profile.getVerificationStatus() : null;
        return new LoginResponse(jwt, account.getId(), account.getName(), account.getEmail(), account.getRole(), vs);
    }

    public void sendVerificationEmail(Long accountId, String email) {
        emailVerificationTokenRepository.deleteAllByAccountId(accountId);

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        emailVerificationTokenRepository.save(new EmailVerificationToken(token, accountId, email, expiresAt));

        emailService.sendVerificationEmail(email, token);
    }

    public LoginResponse verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired verification link"));

        if (verificationToken.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This verification link has already been used");
        }
        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification link has expired. Please request a new one");
        }

        Account account = accountRepository.findById(verificationToken.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        account.setEmailVerified(true);
        accountRepository.save(account);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        String jwt = jwtUtil.generateToken(account.getEmail(), account.getId(), account.getRole());
        MechanicProfile profile = account.getRole() == Role.MECHANIC
                ? mechanicProfileRepository.findByAccountId(account.getId()).orElse(null)
                : null;
        VerificationStatus vs = profile != null ? profile.getVerificationStatus() : null;
        return new LoginResponse(jwt, account.getId(), account.getName(), account.getEmail(), account.getRole(), vs);
    }

    public List<AdminMechanicResponse> getAllMechanics(String search, String status) {
        List<MechanicProfile> profiles;

        if (search != null && !search.isBlank()) {
            profiles = mechanicProfileRepository.searchByNameOrArea(search);
        } else if (status != null && !status.isBlank()) {
            profiles = mechanicProfileRepository.findByVerificationStatus(
                    VerificationStatus.valueOf(status)
            );
        } else {
            profiles = mechanicProfileRepository.findAll();
        }

        return profiles.stream().map(mp -> new AdminMechanicResponse(
                mp.getId(),
                mp.getAccount().getId(),
                mp.getAccount().getName(),
                mp.getAccount().getEmail(),
                mp.getPhone(),
                mp.getServiceRadiusKm(),
                mp.getArea(),
                mp.getVerificationStatus().name(),
                mp.getIsAvailable(),
                mp.getTotalJobsCompleted(),
                mp.getMidJobCancels(),
                mp.getSuspensionReason(),
                mp.getSuspensionEndsAt() != null ? mp.getSuspensionEndsAt().toString() : null,
                mp.getAppealStatus() != null ? mp.getAppealStatus().name() : null,
                mp.getAppealReason(),
                mp.getRejectionReason()
        )).collect(Collectors.toList());
    }

    public List<AdminUserResponse> getAllUsers(String search) {
        List<Account> users;

        if (search != null && !search.isBlank()) {
            users = accountRepository.searchUsersByName(Role.USER, search);
        } else {
            users = accountRepository.findByRole(Role.USER);
        }

        return users.stream().map(a -> new AdminUserResponse(
                a.getId(),
                a.getName(),
                a.getEmail(),
                a.getSosCancelCount(),
                a.getSosTimeoutUntil() != null ? a.getSosTimeoutUntil().toString() : null,
                a.getIsBanned(),
                a.getCreatedAt().toString()
        )).collect(Collectors.toList());
    }

    public void adminSuspendMechanic(Long mechanicProfileId, AdminPenaltyRequest request) {
        MechanicProfile mp = mechanicProfileRepository.findById(mechanicProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic not found"));
        mp.setVerificationStatus(VerificationStatus.SUSPENDED);
        mp.setSuspensionReason(request.reason());
        mp.setSuspensionEndsAt(LocalDateTime.now().plusDays(request.suspensionDays()));
        mechanicProfileRepository.save(mp);
    }

    public void adminUnsuspendMechanic(Long mechanicProfileId) {
        MechanicProfile mp = mechanicProfileRepository.findById(mechanicProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic not found"));
        mp.setVerificationStatus(VerificationStatus.VERIFIED);
        mp.setSuspensionReason(null);
        mp.setSuspensionEndsAt(null);
        mechanicProfileRepository.save(mp);
    }

    public void submitAppeal(Long accountId, String reason) {
        MechanicProfile mp = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mechanic profile not found"));
        if (mp.getVerificationStatus() != VerificationStatus.SUSPENDED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account is not suspended");
        }
        if (mp.getAppealStatus() == AppealStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An appeal is already pending review");
        }
        mp.setAppealReason(reason);
        mp.setAppealStatus(AppealStatus.PENDING);
        mechanicProfileRepository.save(mp);
    }

    public List<AdminMechanicResponse> getPendingAppeals() {
        return mechanicProfileRepository.findByAppealStatus(AppealStatus.PENDING)
                .stream().map(mp -> new AdminMechanicResponse(
                        mp.getId(),
                        mp.getAccount().getId(),
                        mp.getAccount().getName(),
                        mp.getAccount().getEmail(),
                        mp.getPhone(),
                        mp.getServiceRadiusKm(),
                        mp.getArea(),
                        mp.getVerificationStatus().name(),
                        mp.getIsAvailable(),
                        mp.getTotalJobsCompleted(),
                        mp.getMidJobCancels(),
                        mp.getSuspensionReason(),
                        mp.getSuspensionEndsAt() != null ? mp.getSuspensionEndsAt().toString() : null,
                        mp.getAppealStatus() != null ? mp.getAppealStatus().name() : null,
                        mp.getAppealReason(),
                        mp.getRejectionReason()
                )).collect(Collectors.toList());
    }

    public void adminApproveAppeal(Long mechanicProfileId) {
        MechanicProfile mp = mechanicProfileRepository.findById(mechanicProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic not found"));
        if (mp.getAppealStatus() != AppealStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pending appeal to approve");
        }
        mp.setVerificationStatus(VerificationStatus.VERIFIED);
        mp.setSuspensionReason(null);
        mp.setSuspensionEndsAt(null);
        mp.setAppealStatus(AppealStatus.APPROVED);
        mechanicProfileRepository.save(mp);
    }

    public void adminRejectAppeal(Long mechanicProfileId) {
        MechanicProfile mp = mechanicProfileRepository.findById(mechanicProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic not found"));
        if (mp.getAppealStatus() != AppealStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pending appeal to reject");
        }
        mp.setAppealStatus(AppealStatus.REJECTED);
        mechanicProfileRepository.save(mp);
    }

    public void adminDeleteMechanic(Long mechanicProfileId) {
        MechanicProfile mp = mechanicProfileRepository.findById(mechanicProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic not found"));
        Account account = mp.getAccount();
        mechanicProfileRepository.delete(mp);
        accountRepository.delete(account);
    }

    public void adminSetUserBan(Long accountId, boolean ban) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        account.setIsBanned(ban);
        accountRepository.save(account);
    }

    public void adminSetUserTimeout(Long accountId, AdminTimeoutRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.hours() == 0) {
            account.setSosTimeoutUntil(null);
            account.setSosCancelCount(0);
        } else {
            account.setSosTimeoutUntil(LocalDateTime.now().plusHours(request.hours()));
        }
        accountRepository.save(account);
    }

    public void adminDeleteUser(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        accountRepository.delete(account);
    }

    public void updateHeartbeat(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Mechanic profile not found"));
        profile.setLastHeartbeatAt(LocalDateTime.now());
        mechanicProfileRepository.save(profile);
    }

    public String uploadProfilePhoto(Long accountId, MultipartFile file) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        try {
            String url = cloudinaryService.upload(file, "pitstop/profiles");
            account.setProfilePhotoUrl(url);
            accountRepository.save(account);
            return url;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    public void updateName(Long accountId, String name) {
        if (name == null || name.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name cannot be blank");
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        account.setName(name.trim());
        accountRepository.save(account);
    }

}
