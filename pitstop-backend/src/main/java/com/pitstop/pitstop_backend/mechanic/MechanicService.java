package com.pitstop.pitstop_backend.mechanic;

import com.pitstop.pitstop_backend.auth.JwtUtil;
import com.pitstop.pitstop_backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MechanicService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final MechanicRepository mechanicRepository;

    public MechanicService(MechanicRepository mechanicRepository){
        this.mechanicRepository = mechanicRepository;
    }

    public String loginMechanic(String email, String password){
        Mechanic mechanic = mechanicRepository.findByEmail(email)
                .orElseThrow(()-> new ResourceNotFoundException("Mechanic not found"));

        if (!passwordEncoder.matches(password, mechanic.getPassword())){
            throw new IllegalArgumentException("Invalid password");
        }
        return jwtUtil.generateToken(mechanic.getEmail());
    }
    public List<Mechanic> getAllMechanics(){
        return mechanicRepository.findAll();
    }
    public Mechanic addMechanic(Mechanic mechanic){
        mechanic.setPassword(passwordEncoder.encode(mechanic.getPassword()));
        return mechanicRepository.save(mechanic);
    }
    public Mechanic getMechanicById(Long id){
        return mechanicRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("Mechanic not found with id "+ id));
    }
    public Mechanic updateMechanic(Long id, Mechanic updatedData){
        Mechanic existingMechanic = mechanicRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("Mechanic not found with id "+ id));
        existingMechanic.setAvailable(updatedData.isAvailable());
        existingMechanic.setLatitude(updatedData.getLatitude());
        existingMechanic.setLongitude(updatedData.getLongitude());

        return mechanicRepository.save(existingMechanic);
    }
    public String deleteMechanic(Long id){
        if(!mechanicRepository.existsById(id)){
            throw new ResourceNotFoundException("Mechanic not found with id "+ id);
        }
        mechanicRepository.deleteById(id);
        return "Mechanic with ID "+id+" has been removed from PitStop";
    }
}
