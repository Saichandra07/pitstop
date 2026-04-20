package com.pitstop.pitstop_backend.account;


import com.pitstop.pitstop_backend.account.dto.*;
import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import com.pitstop.pitstop_backend.account.dto.MechanicPendingResponse;
import com.pitstop.pitstop_backend.account.dto.VerifyMechanicRequest;
import com.pitstop.pitstop_backend.account.RejectionReason;

import java.security.Principal;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService){
        this.accountService = accountService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<LoginResponse> register (@RequestBody RegisterRequest request){
        LoginResponse response = accountService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        // .body(response) — token + user info returned immediately after register
        // user is logged at the moment they register, no second login call needed
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request){
        LoginResponse response = accountService.login(request);
        return ResponseEntity.ok(response);
        //200 OK - no resource created, just authenticated
    }

    // PATCH /api/accounts/availability — MECHANIC only (SecurityConfig)
    // Flips isAvailable true↔false. VERIFIED check is in service layer.
    @PatchMapping("/accounts/availability")
    public ResponseEntity<Void> toggleAvailability() {
        accountService.toggleAvailability(getAccountId());
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

    private Long getAccountId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

}
