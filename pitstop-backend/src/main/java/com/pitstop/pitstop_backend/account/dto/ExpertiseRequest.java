// account/dto/ExpertiseRequest.java
package com.pitstop.pitstop_backend.account.dto;

import com.pitstop.pitstop_backend.job.ProblemType;
import com.pitstop.pitstop_backend.job.VehicleType;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ExpertiseRequest(

        @NotEmpty(message = "At least one wheeler type is required")
        List<WheelerExpertise> expertise
) {
    public record WheelerExpertise(

            VehicleType wheelerType,

            @NotEmpty(message = "At least one problem type is required per wheeler")
            List<ProblemType> problemTypes
    ) {}
}