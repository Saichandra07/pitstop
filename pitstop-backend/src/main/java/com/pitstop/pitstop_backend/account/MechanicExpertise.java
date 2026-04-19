package com.pitstop.pitstop_backend.account;

import com.pitstop.pitstop_backend.job.ProblemType;
import com.pitstop.pitstop_backend.job.VehicleType;
import jakarta.persistence.*;

@Entity
@Table(name = "mechanic_expertise")
public class MechanicExpertise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which mechanic this expertise belongs to
    @Column(name = "mechanic_profile_id", nullable = false)
    private Long mechanicProfileId;

    // Which wheeler type this skill applies to
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType wheelerType;

    // Which problem this mechanic can fix for that wheeler type
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProblemType problemType;

    // Tracks jobs completed with this specific skill — used for probation (need 5 to unlock)
    @Column(nullable = false)
    private Integer jobsCompleted = 0;

    public Long getId() { return id; }

    public Long getMechanicProfileId() { return mechanicProfileId; }
    public void setMechanicProfileId(Long mechanicProfileId) { this.mechanicProfileId = mechanicProfileId; }

    public VehicleType getWheelerType() { return wheelerType; }
    public void setWheelerType(VehicleType wheelerType) { this.wheelerType = wheelerType; }

    public ProblemType getProblemType() { return problemType; }
    public void setProblemType(ProblemType problemType) { this.problemType = problemType; }

    public Integer getJobsCompleted() { return jobsCompleted; }
    public void setJobsCompleted(Integer jobsCompleted) { this.jobsCompleted = jobsCompleted; }
}