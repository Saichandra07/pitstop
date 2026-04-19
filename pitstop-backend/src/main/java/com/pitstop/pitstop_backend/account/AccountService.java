package com.pitstop.pitstop_backend.account;

import com.pitstop.pitstop_backend.account.dto.*;
import com.pitstop.pitstop_backend.auth.JwtUtil;
import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.pitstop.pitstop_backend.account.dto.MechanicPendingResponse;
import com.pitstop.pitstop_backend.account.dto.VerifyMechanicRequest;
import com.pitstop.pitstop_backend.account.RejectionReason;
import java.util.List;


@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private  final MechanicProfileRepository mechanicProfileRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RejectionReasonRepository rejectionReasonRepository;

    public AccountService (AccountRepository accountRepository,
                           MechanicProfileRepository mechanicProfileRepository,
                           JwtUtil jwtUtil,
                           PasswordEncoder passwordEncoder,
                           RejectionReasonRepository rejectionReasonRepository
                           ){
        this.accountRepository = accountRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.rejectionReasonRepository = rejectionReasonRepository;

    }
    public LoginResponse register(RegisterRequest request){

        //reject duplicate emails before doing anything else
        if(accountRepository.existsByEmail(request.email())){
            throw new RuntimeException("Email already registered");
        }

        // validate mechanic-specific fields are present if role is MECHANIC
        // we don't do this with @Valid because the fields are conditionally required
        if(request.role()==Role.MECHANIC){
            if (request.phone() == null || request.phone().isBlank()){
                throw new RuntimeException("Phone number is required for mechanic registration");
            }
            if (request.serviceRadiusKm()==null){
                throw new RuntimeException("Service radius is required for mechanic");
            }
        }
        //build and save the account - same for both roles
        Account account = new Account();
        account.setEmail(request.email());
        account.setName(request.name());
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRole(request.role());

        //upgradeStatus left null- no upgrade requested yet

        Account saved  = accountRepository.save(account);

        //if MECHANIC - create the profile row linked to this account
        //verificationStatus and isAvailable are set by @PrePersist - we don't set them here
        if(request.role() == Role.MECHANIC){
            MechanicProfile profile = new MechanicProfile();
            profile.setAccount(saved);
            profile.setPhone(request.phone());
            profile.setServiceRadiusKm(request.serviceRadiusKm());
            profile.setVerificationStatus(VerificationStatus.PENDING);
            mechanicProfileRepository.save(profile);
        }
        // issue JWT with accountId and role baked in
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getId(), saved.getRole());
        VerificationStatus verificationStatus = request.role() == Role.MECHANIC
                ? VerificationStatus.PENDING : null;
        return new LoginResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), verificationStatus);    }

    public LoginResponse login (LoginRequest request){
        // fetch account by email — if not found, don't reveal whether email exists
        Account account = accountRepository.findByEmail(request.email())
                .orElseThrow(()-> new RuntimeException("Invalid credentials"));

        //BCrypt compare - reject wrong passwords
        if(!passwordEncoder.matches(request.password(), account.getPasswordHash())){
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

    // Issue #5 — mechanic toggles their own availability
    // Only VERIFIED mechanics can go online — unverified ones stay blocked
    public void toggleAvailability(Long accountId) {
        MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No mechanic profile found"));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only verified mechanics can change availability");
        }

        profile.setIsAvailable(!profile.getIsAvailable());
        mechanicProfileRepository.save(profile);
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

    public AccountMeResponse getMe(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        if (account.getRole() == Role.MECHANIC) {
            MechanicProfile profile = mechanicProfileRepository.findByAccountId(accountId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mechanic profile not found"));

            return new AccountMeResponse(
                    account.getId(),
                    account.getName(),
                    account.getEmail(),
                    account.getRole().name(),
                    profile.getVerificationStatus(),
                    profile.getIsAvailable(),
                    profile.getRejectionReason()
            );
        }
        return new AccountMeResponse(
                account.getId(),
                account.getName(),
                account.getEmail(),
                account.getRole().name(),
                null,
                null,
                null
        );
    }

}
