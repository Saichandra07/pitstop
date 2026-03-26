package com.pitstop.pitstop_backend.mechanic;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/mechanics")
public class MechanicController {
    private final MechanicService mechanicService;

    public MechanicController(MechanicService mechanicService){
        this.mechanicService = mechanicService;
    }
    @GetMapping
    public List<Mechanic> getAllMechanics(){
        return mechanicService.getAllMechanics();
    }
    @PostMapping
    public Mechanic addMechanic(@RequestBody Mechanic mechanic){
        return mechanicService.addMechanic(mechanic);
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
