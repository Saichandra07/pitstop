package com.pitstop.pitstop_backend.job;

import com.pitstop.pitstop_backend.exception.ResourceNotFoundException;
import com.pitstop.pitstop_backend.mechanic.Mechanic;
import com.pitstop.pitstop_backend.mechanic.MechanicRepository;
import com.pitstop.pitstop_backend.user.User;
import com.pitstop.pitstop_backend.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final MechanicRepository mechanicRepository;

    public JobService(JobRepository jobRepository,
                      UserRepository userRepository,
                      MechanicRepository mechanicRepository
                      ){
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.mechanicRepository = mechanicRepository;

    }

    // Create job - mechanic not assigned yet
    public Job createJob (Long userId, Job job){
        User user = userRepository.findById(userId)
                .orElseThrow(()-> new ResourceNotFoundException("User not found with id "+ userId));
        job.setUser(user);
        job.setStatus(JobStatus.PENDING);
        return jobRepository.save(job);
    }

    // Get all jobs
    public List<Job> getAllJobs(){
        return jobRepository.findAll();
    }

    // Get job by id
    public Job getJobById(Long id){
        return jobRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Job not found with this id "+ id));
    }

    // Get all jobs for a specific user
    public List<Job> getJobsByUser(Long userId){
        return jobRepository.findByUserId(userId);
    }

    // Get all jobs for a specific mechanic
    public List<Job> getJobsByMechanic(Long mechanicId){
        return jobRepository.findByMechanicId(mechanicId);
    }

    // Assign a mechanic to a job
    public Job assignMechanic(Long jobId , Long mechanicId){
        Job job = getJobById(jobId);
        Mechanic mechanic = mechanicRepository.findById(mechanicId)
                .orElseThrow(()-> new ResourceNotFoundException("Mechanic not found with id "+ mechanicId));
        job.setMechanic(mechanic);
        job.setStatus(JobStatus.ACCEPTED);
        return jobRepository.save(job);
    }

    // update job status
    public Job updateStatus(Long jobId, JobStatus status){
        Job job = getJobById(jobId);
        job.setStatus(status);
        return jobRepository.save(job);
    }

    // delete job
    public void deleteJob(Long id){
        Job job = getJobById(id);
        jobRepository.delete(job);
    }

}
