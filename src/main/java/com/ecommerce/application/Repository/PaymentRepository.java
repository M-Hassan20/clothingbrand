package com.ecommerce.application.Repository;

import com.ecommerce.application.ENUM.PaymentStatus;
import com.ecommerce.application.Entity.Order;
import com.ecommerce.application.Entity.Payment;
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
