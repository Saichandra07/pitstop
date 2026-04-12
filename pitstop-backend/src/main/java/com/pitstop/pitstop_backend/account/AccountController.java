package com.pitstop.pitstop_backend.account;


import com.pitstop.pitstop_backend.account.dto.LoginRequest;
import com.pitstop.pitstop_backend.account.dto.RegisterRequest;
import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService){
        this.accountService = accountService;
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register (@RequestBody RegisterRequest request){
        LoginResponse response = accountService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        // .body(response) — token + user info returned immediately after register
        // user is logged at the moment they register, no second login call needed
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request){
        LoginResponse response = accountService.login(request);
        return ResponseEntity.ok(response);
        //200 OK - no resource created, just authenticated
    }
}
