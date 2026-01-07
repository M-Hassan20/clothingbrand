package com.ecommerce.application.repository;

import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrder(Order order);
    Optional<Payment> findByOrderId(Long orderId);
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
    List<Payment> findByPaymentStatus(PaymentStatus paymentStatus);
}
