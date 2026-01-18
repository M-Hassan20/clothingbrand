package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.response.PaymentResponse;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.Payment;
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.mapper.PaymentMapper;
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
    private final PaymentMapper paymentMapper;
    // TODO: Add Stripe service when integrating payment gateway

    public PaymentResponse getPaymentById(Long id) {
        return paymentMapper.toResponse(paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id)));
    }

    private Payment getPaymentEntityById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }

    public PaymentResponse getPaymentByOrderId(Long orderId) {
        return paymentMapper.toResponse(paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order id: " + orderId)));
    }

    public PaymentResponse getPaymentByStripeIntentId(String stripePaymentIntentId) {
        return paymentMapper.toResponse(paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)
                .orElseThrow(() -> new RuntimeException(
                        "Payment not found with Stripe intent id: " + stripePaymentIntentId)));
    }

    private Payment getPaymentEntityByStripeIntentId(String stripePaymentIntentId) {
        return paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)
                .orElseThrow(() -> new RuntimeException(
                        "Payment not found with Stripe intent id: " + stripePaymentIntentId));
    }

    // Create payment intent (prepare for payment)
    @Transactional
    public PaymentResponse createPaymentIntent(Long orderId) {
        Order order = orderService.getOrderEntityById(orderId);

        // TODO: Create Stripe Payment Intent here
        // String stripeIntentId = stripeService.createPaymentIntent(order.getTotalAmount());

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("USD") // Or get from config
                .paymentStatus(PaymentStatus.PENDING)
                // .stripePaymentIntentId(stripeIntentId)
                .build();

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    // Confirm payment (after Stripe webhook)
    @Transactional
    public PaymentResponse confirmPayment(String stripePaymentIntentId) {
        Payment payment = getPaymentEntityByStripeIntentId(stripePaymentIntentId);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);

        // Update order status
        orderService.updateOrderStatus(payment.getOrder().getId(),
                com.ecommerce.application.enums.OrderStatus.PAID);

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    // Handle failed payment
    @Transactional
    public PaymentResponse failPayment(String stripePaymentIntentId) {
        Payment payment = getPaymentEntityByStripeIntentId(stripePaymentIntentId);
        payment.setPaymentStatus(PaymentStatus.FAILED);
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    // Refund payment
    @Transactional
    public PaymentResponse refundPayment(Long paymentId) {
        Payment payment = getPaymentEntityById(paymentId);

        if (payment.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new RuntimeException("Can only refund completed payments");
        }

        // TODO: Process Stripe refund
        // stripeService.refund(payment.getStripePaymentIntentId());

        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }
}