package com.pitstop.pitstop_backend.account;

import com.pitstop.pitstop_backend.account.dto.LoginRequest;
import com.pitstop.pitstop_backend.account.dto.RegisterRequest;
import com.pitstop.pitstop_backend.auth.JwtUtil;
import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private  final MechanicProfileRepository mechanicProfileRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AccountService (AccountRepository accountRepository,
                           MechanicProfileRepository mechanicProfileRepository,
                           JwtUtil jwtUtil,
                           PasswordEncoder passwordEncoder
                           ){
        this.accountRepository = accountRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
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
            if (request.expertise()==null || request.expertise().isBlank()){
                throw new RuntimeException("Expertise is required for mechanic registration");
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
            profile.setExpertise(request.expertise());
            profile.setServiceRadiusKm(request.serviceRadiusKm());
            mechanicProfileRepository.save(profile);
        }
        // issue JWT with accountId and role baked in
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getId(), saved.getRole());
        return  new LoginResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole());
    }
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
        return new LoginResponse(token, account.getId(), account.getName(), account.getEmail(), account.getRole());
    }
}
