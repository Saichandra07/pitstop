package com.pitstop.pitstop_backend.user;


import com.pitstop.pitstop_backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public User createUser(User user){
        if(userRepository.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("Email already registered: "+ user.getEmail());
        }
        if(userRepository.existsByPhone(user.getPhone())){
            throw new IllegalArgumentException(("PhoneNumber already registereed "+ user.getPhone()));
        }
        return userRepository.save(user);
    }
    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    public User getUserById(Long id){
        return userRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("User not found with id "+ id));
    }

    public User updateUser(Long id, User updateUser){
        User existing = userRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("User not found with id "+ id));

        existing.setName(updateUser.getName());
        existing.setPhone(updateUser.getPhone());
        existing.setLatitude(updateUser.getLatitude());
        existing.setLongitude(updateUser.getLongitude());

        return userRepository.save(existing);
    }
    public void deleteUser(long id){
        if(!userRepository.existsById(id)){
            throw new ResourceNotFoundException("User not found with id: "+id);
        }
        userRepository.deleteById(id);
    }
}
