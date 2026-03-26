package com.pitstop.pitstop_backend.mechanic;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MechanicService {
    private final MechanicRepository mechanicRepository;

    public MechanicService(MechanicRepository mechanicRepository){
        this.mechanicRepository = mechanicRepository;
    }
    public List<Mechanic> getAllMechanics(){
        return mechanicRepository.findAll();
    }
    public Mechanic addMechanic(Mechanic mechanic){
        return mechanicRepository.save(mechanic);
    }
    public Mechanic getMechanicById(Long id){
        return mechanicRepository.findById(id).orElseThrow(()-> new RuntimeException("Mechanic not found with id: "+id));
    }
    public Mechanic updateMechanic(Long id, Mechanic updatedData){
        Mechanic existingMechanic = mechanicRepository.findById(id).orElseThrow(()->new RuntimeException("Mechanic not found with id: "+ id ));
        existingMechanic.setAvailable(updatedData.isAvailable());
        existingMechanic.setLatitude(updatedData.getLatitude());
        existingMechanic.setLongitude(updatedData.getLongitude());

        return mechanicRepository.save(existingMechanic);
    }
    public String deleteMechanic(Long id){
        if(!mechanicRepository.existsById(id)){
            throw new RuntimeException("Mechanic not found with id: "+id);
        }
        mechanicRepository.deleteById(id);
        return "Mechanic with ID "+id+" has been removed from PitStop";
    }
}
