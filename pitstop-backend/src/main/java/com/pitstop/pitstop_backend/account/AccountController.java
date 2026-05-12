package com.pitstop.pitstop_backend.account;


import com.pitstop.pitstop_backend.account.dto.*;
import com.pitstop.pitstop_backend.account.dto.AvailabilityRequest;
import com.pitstop.pitstop_backend.auth.JwtUtil;
import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import com.pitstop.pitstop_backend.job.JobService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import com.pitstop.pitstop_backend.account.dto.MechanicPendingResponse;
import com.pitstop.pitstop_backend.account.dto.VerifyMechanicRequest;
import com.pitstop.pitstop_backend.account.RejectionReason;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api")
public class AccountController {
    private final AccountService accountService;
    private final JwtUtil jwtUtil;
    private final AccountRepository accountRepository;
    private final JobService jobService;

    public AccountController(AccountService accountService, JwtUtil jwtUtil, AccountRepository accountRepository, JobService jobService){
        this.accountService = accountService;
        this.jwtUtil = jwtUtil;
        this.accountRepository = accountRepository;
        this.jobService = jobService;
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout() {
        jobService.cancelJobOnLogout(getAccountId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auth/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        LoginResponse response = accountService.register(request, getClientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        LoginResponse response = accountService.login(request, getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    // PATCH /api/accounts/availability — MECHANIC only (SecurityConfig)
    // Sets availability explicitly. Lat/lng required when going online — stored for broadcast.
    @PatchMapping("/accounts/availability")
    public ResponseEntity<Void> toggleAvailability(@RequestBody AvailabilityRequest request) {
        accountService.toggleAvailability(getAccountId(), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/setup")
    public ResponseEntity<LoginResponse> setupAdmin(@Valid @RequestBody AdminSetupRequest request) {
        LoginResponse response = accountService.setupAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/admin/mechanics/pending")
    public ResponseEntity<List<MechanicPendingResponse>> getPendingMechanics() {
        return ResponseEntity.ok(accountService.getPendingMechanics());
    }

    @PatchMapping("/admin/mechanics/{id}/verify")
    public ResponseEntity<Void> verifyMechanic(@PathVariable Long id,
                                               @Valid @RequestBody VerifyMechanicRequest request) {
        accountService.verifyMechanic(id, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/rejection-reasons")
    public ResponseEntity<List<RejectionReason>> getRejectionReasons() {
        return ResponseEntity.ok(accountService.getRejectionReasons());
    }

    @PostMapping("/admin/rejection-reasons")
    public ResponseEntity<RejectionReason> addRejectionReason(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.addRejectionReason(body.get("reason")));
    }

    @DeleteMapping("/admin/rejection-reasons/{id}")
    public ResponseEntity<Void> deleteRejectionReason(@PathVariable Long id) {
        accountService.deleteRejectionReason(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/accounts/me")
    public ResponseEntity<AccountMeResponse> getMe(Principal principal) {
        Long accountId = Long.parseLong(principal.getName());
        return ResponseEntity.ok(accountService.getMe(accountId));
    }

    // PATCH /api/accounts/expertise — MECHANIC only (SecurityConfig)
    // Replaces all expertise rows for this mechanic with the new selection.
    @PatchMapping("/accounts/expertise")
    public ResponseEntity<Void> updateExpertise(@Valid @RequestBody ExpertiseRequest request) {
        Long accountId = getAccountId();
        accountService.updateExpertise(accountId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        accountService.forgotPassword(request.email());
        return ResponseEntity.ok("If that email exists, a reset link has been sent.");
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<LoginResponse> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        LoginResponse response = accountService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/send-verification")
    public ResponseEntity<String> sendVerification(Authentication authentication) {
        Long accountId = Long.parseLong(authentication.getName());
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        accountService.sendVerificationEmail(accountId, account.getEmail());
        return ResponseEntity.ok("Verification email sent.");
    }

    @PostMapping("/auth/verify-email")
    public ResponseEntity<LoginResponse> verifyEmail(@RequestParam String token) {
        LoginResponse response = accountService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    private Long getAccountId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    // Respects X-Forwarded-For so the correct IP is captured behind a proxy/load balancer
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }

    // Admin - Mechanics
    @GetMapping("/admin/mechanics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminMechanicResponse>> getAllMechanics(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(accountService.getAllMechanics(search, status));
    }

    @PostMapping("/admin/mechanics/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> suspendMechanic(
            @PathVariable Long id,
            @RequestBody @Valid AdminPenaltyRequest request) {
        accountService.adminSuspendMechanic(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/mechanics/{id}/unsuspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unsuspendMechanic(@PathVariable Long id) {
        accountService.adminUnsuspendMechanic(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/admin/mechanics/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMechanic(@PathVariable Long id) {
        accountService.adminDeleteMechanic(id);
        return ResponseEntity.noContent().build();
    }

    //Admin - users
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(accountService.getAllUsers(search));
    }

    @PostMapping("/admin/users/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> banUser(@PathVariable Long id) {
        accountService.adminSetUserBan(id, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/users/{id}/unban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unbanUser(@PathVariable Long id) {
        accountService.adminSetUserBan(id, false);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/users/{id}/timeout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> setUserTimeout(
            @PathVariable Long id,
            @RequestBody AdminTimeoutRequest request) {
        accountService.adminSetUserTimeout(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        accountService.adminDeleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/accounts/name")
    public ResponseEntity<Void> updateName(@RequestBody Map<String, String> body) {
        accountService.updateName(getAccountId(), body.get("name"));
        return ResponseEntity.noContent().build();
    }

}
