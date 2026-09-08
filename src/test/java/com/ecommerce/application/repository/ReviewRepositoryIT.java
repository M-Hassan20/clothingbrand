package com.ecommerce.application.repository;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Review;
import com.ecommerce.application.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.data.Offset.offset;

@Transactional
class ReviewRepositoryIT extends AbstractIntegrationTest {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;

    private User user1;
    private User user2;
    private User user3;
    private Product product;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save((User) TestDataFactory.aCustomerUser().email("u1@test.com").build());
        user2 = userRepository.save((User) TestDataFactory.aCustomerUser().email("u2@test.com").build());
        user3 = userRepository.save((User) TestDataFactory.aCustomerUser().email("u3@test.com").build());
        product = productRepository.save((Product) TestDataFactory.aProduct().build());
    }

    @Test
    void getAverageRatingByProductId_averagesApprovedReviewsOnly() {
        // 1. Save approved 5-star review
        Review r1 = (Review) TestDataFactory.aReview().user(user1).product(product).rating(5).isApproved(true).build();
        reviewRepository.save(r1);

        // 2. Save approved 3-star review
        Review r2 = (Review) TestDataFactory.aReview().user(user2).product(product).rating(3).isApproved(true).build();
        reviewRepository.save(r2);

        // 3. Save unapproved 1-star review (should not influence average)
        Review r3 = (Review) TestDataFactory.aReview().user(user3).product(product).rating(1).isApproved(false).build();
        reviewRepository.save(r3);

        Double average = reviewRepository.getAverageRatingByProductId(product.getId());
        assertThat(average).isCloseTo(4.0, offset(0.01));
    }
}
