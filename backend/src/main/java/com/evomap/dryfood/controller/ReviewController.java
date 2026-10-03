package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.Review;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.service.ReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<Review> listByProduct(@RequestParam Long productId) {
        return reviewService.findByProduct(productId);
    }

    @PostMapping
    public ResponseEntity<Review> create(@Valid @RequestBody ReviewRequest body,
                                         @RequestAttribute("user") User user) {
        Review saved = reviewService.create(user, body.productId(), body.rating(), body.comment(), body.orderId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public record ReviewRequest(
            @NotNull(message = "productId khong duoc de trong") Long productId,
            @NotNull(message = "So sao khong duoc de trong")
            @Min(1) @Max(5) Integer rating,
            String comment,
            Long orderId
    ) {
    }
}