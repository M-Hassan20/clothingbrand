package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.Payment;
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    // TODO: Add Stripe service when integrating payment gateway

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }

    public Payment getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order id: " + orderId));
    }

    public Payment getPaymentByStripeIntentId(String stripePaymentIntentId) {
        return paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)
                .orElseThrow(() -> new RuntimeException(
                        "Payment not found with Stripe intent id: " + stripePaymentIntentId));
    }

    // Create payment intent (prepare for payment)
    @Transactional
    public Payment createPaymentIntent(Long orderId) {
        Order order = orderService.getOrderById(orderId);

        // TODO: Create Stripe Payment Intent here
        // String stripeIntentId = stripeService.createPaymentIntent(order.getTotalAmount());

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("USD") // Or get from config
                .paymentStatus(PaymentStatus.PENDING)
                // .stripePaymentIntentId(stripeIntentId)
                .build();

        return paymentRepository.save(payment);
    }

    // Confirm payment (after Stripe webhook)
    @Transactional
    public Payment confirmPayment(String stripePaymentIntentId) {
        Payment payment = getPaymentByStripeIntentId(stripePaymentIntentId);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);

        // Update order status
        orderService.updateOrderStatus(payment.getOrder().getId(),
                com.ecommerce.application.enums.OrderStatus.PAID);

        return paymentRepository.save(payment);
    }

    // Handle failed payment
    @Transactional
    public Payment failPayment(String stripePaymentIntentId) {
        Payment payment = getPaymentByStripeIntentId(stripePaymentIntentId);
        payment.setPaymentStatus(PaymentStatus.FAILED);
        return paymentRepository.save(payment);
    }

    // Refund payment
    @Transactional
    public Payment refundPayment(Long paymentId) {
        Payment payment = getPaymentById(paymentId);

        if (payment.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new RuntimeException("Can only refund completed payments");
        }

        // TODO: Process Stripe refund
        // stripeService.refund(payment.getStripePaymentIntentId());

        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        return paymentRepository.save(payment);
    }
}