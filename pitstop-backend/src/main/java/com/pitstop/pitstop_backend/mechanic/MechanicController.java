package com.pitstop.pitstop_backend.mechanic;

import com.pitstop.pitstop_backend.common.dto.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/mechanics")
public class MechanicController {
    private final MechanicService mechanicService;

    public MechanicController(MechanicService mechanicService){

        this.mechanicService = mechanicService;
    }
    record LoginRequest(String email, String password){}

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request){
        LoginResponse response = mechanicService.loginMechanic(request.email(), request.password());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<Mechanic> getAllMechanics(){
        return mechanicService.getAllMechanics();
    }

    @PostMapping("/register")
    public ResponseEntity<Mechanic> addMechanic(@RequestBody Mechanic mechanic){

        return new ResponseEntity<>(mechanicService.addMechanic(mechanic), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public Mechanic getMechanicById(@PathVariable Long id){

        return mechanicService.getMechanicById(id);
    }

    @PutMapping("/{id}")
    public Mechanic updateMechanic(@PathVariable Long id,@RequestBody Mechanic mechanic){
        return mechanicService.updateMechanic(id,mechanic);
    }

    @DeleteMapping("/{id}")
    public String deleteMechanic(@PathVariable Long id){
        return mechanicService.deleteMechanic(id);
    }
}
