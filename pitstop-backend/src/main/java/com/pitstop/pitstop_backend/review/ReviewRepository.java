package com.pitstop.pitstop_backend.review;

import com.pitstop.pitstop_backend.account.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByJobIdAndReviewerId(Long jobId, Long reviewerId);
}
