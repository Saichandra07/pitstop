package com.pitstop.pitstop_backend.review;

import com.pitstop.pitstop_backend.account.MechanicProfileRepository;
import com.pitstop.pitstop_backend.account.Review;
import com.pitstop.pitstop_backend.job.Job;
import com.pitstop.pitstop_backend.job.JobRepository;
import com.pitstop.pitstop_backend.job.JobStatus;
import com.pitstop.pitstop_backend.review.dto.ReviewRequestDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReviewService {

    private final JobRepository jobRepository;
    private final ReviewRepository reviewRepository;
    private final MechanicProfileRepository mechanicProfileRepository;

    public ReviewService(JobRepository jobRepository,
                         ReviewRepository reviewRepository,
                         MechanicProfileRepository mechanicProfileRepository) {
        this.jobRepository = jobRepository;
        this.reviewRepository = reviewRepository;
        this.mechanicProfileRepository = mechanicProfileRepository;
    }

    @Transactional
    public void submitReview(Long jobId, Long reviewerAccountId, ReviewRequestDto dto) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not completed yet");
        }

        if (!job.getAccountId().equals(reviewerAccountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your job");
        }

        if (reviewRepository.existsByJobIdAndReviewerId(jobId, reviewerAccountId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already reviewed");
        }

        Review review = new Review();
        review.setJobId(jobId);
        review.setMechanicId(job.getMechanicProfileId());
        review.setReviewerId(reviewerAccountId);
        review.setRating(dto.rating());
        review.setComment(dto.comment());

        List<String> tags = dto.tags();
        if (tags != null && !tags.isEmpty()) {
            review.setTags(String.join(",", tags));
        }

        reviewRepository.save(review);

        mechanicProfileRepository.findById(job.getMechanicProfileId()).ifPresent(profile -> {
            int count = profile.getReviewCount() != null ? profile.getReviewCount() : 0;
            double newAvg = (profile.getAverageRating() == null)
                    ? dto.rating()
                    : (profile.getAverageRating() * count + dto.rating()) / (count + 1);
            profile.setAverageRating(newAvg);
            profile.setReviewCount(count + 1);
            mechanicProfileRepository.save(profile);
        });
    }
}
