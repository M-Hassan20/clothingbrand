package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.GuestReviewRequest;
import com.ecommerce.application.dto.request.ReviewCreateRequest;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Review;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.mapper.ReviewMapper;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.repository.ReviewRepository;
import com.ecommerce.application.repository.UserRepository;
import com.ecommerce.application.service.impl.OrderService;
import com.ecommerce.application.service.impl.ReviewService;
import com.ecommerce.application.service.impl.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserService userService;
    @Mock private OrderService orderService;
    @Mock private ReviewMapper reviewMapper;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void createReview_ratingOutOfBounds_throwsException() {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 6, "Excellent"); // rating 6 is invalid
        assertThatThrownBy(() -> reviewService.createReview(1L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Rating must be between 1 and 5");
    }

    @Test
    void createReview_duplicateReview_throwsException() {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 5, "Good");
        when(reviewRepository.existsByProductIdAndUserId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> reviewService.createReview(1L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("You have already reviewed this product");
    }

    @Test
    void createReview_notPurchasedProduct_throwsException() {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 5, "Good");
        when(reviewRepository.existsByProductIdAndUserId(1L, 1L)).thenReturn(false);
        when(productRepository.findById(1L)).thenReturn(Optional.of(new Product()));
        when(userService.getUserEntityById(1L)).thenReturn(new User());
        when(orderService.hasUserPurchasedProduct(1L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> reviewService.createReview(1L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("You can only review products that you have actually purchased");
    }

    @Test
    void createReview_validVerifiedPurchase_savesReview() {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 5, "Love it!");
        Product product = Product.builder().id(1L).build();
        User user = User.builder().id(2L).build();

        when(reviewRepository.existsByProductIdAndUserId(1L, 2L)).thenReturn(false);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(userService.getUserEntityById(2L)).thenReturn(user);
        when(orderService.hasUserPurchasedProduct(2L, 1L)).thenReturn(true);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reviewService.createReview(2L, request);

        verify(reviewRepository).save(argThat(review -> 
            review.getRating() == 5 &&
            review.getComment().equals("Love it!") &&
            review.getIsVerifiedPurchase() &&
            review.getIsApproved()
        ));
    }

    @Test
    void createGuestReview_noCompletedOrder_throwsException() {
        GuestReviewRequest request = new GuestReviewRequest();
        request.setGuestEmail("no-order@test.com");
        request.setProductId(1L);
        request.setRating(5);
        request.setComment("Nice");

        User guestUser = User.builder().id(10L).email("no-order@test.com").build();

        when(userRepository.findByEmail("no-order@test.com")).thenReturn(Optional.of(guestUser));
        when(orderService.hasUserPurchasedProduct(10L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> reviewService.createGuestReview(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("We couldn't find a completed order under this email for this product");
    }
}
