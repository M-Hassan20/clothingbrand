package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.payment.SafePayCheckoutResponse;
import com.ecommerce.application.dto.response.PaymentResponse;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.Payment;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.mapper.PaymentMapper;
import com.ecommerce.application.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final PaymentMapper paymentMapper;
    private final SafePayService safePayService;
    private final CartService cartService;

    public PaymentResponse getPaymentById(Long id) {
        return paymentMapper.toResponse(getPaymentEntityById(id));
    }

    private Payment getPaymentEntityById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }

    public PaymentResponse getPaymentByOrderId(Long orderId) {
        return paymentMapper.toResponse(paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order id: " + orderId)));
    }

    @Transactional
    public SafePayCheckoutResponse initiateSafePayCheckout(Long orderId) {
        return initiateSafePayCheckout(orderId, "CYBERSOURCE");
    }

    @Transactional
    public SafePayCheckoutResponse initiateSafePayCheckout(Long orderId, String intent) {
        Order order = orderService.getOrderEntityById(orderId);
        orderService.updateOrderStatus(orderId, OrderStatus.PENDING);

        String effectiveIntent = (intent != null && !intent.trim().isEmpty())
                ? intent.trim().toUpperCase()
                : "CYBERSOURCE";

        var checkoutSession = safePayService.createCheckoutSession(orderId, order.getTotalAmount(), effectiveIntent);

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .currency("PKR")
                        .build());

        payment.setPaymentStatus(PaymentStatus.INITIATED);
        payment.setStripePaymentIntentId(checkoutSession.getTrackerToken());
        orderService.updateOrderStatus(order.getId(), OrderStatus.PROCESSING);
        paymentRepository.save(payment);

        log.info("SafePay checkout initiated for order ID {} with intent {}. PaymentStatus set to INITIATED, tracker: {}", orderId, effectiveIntent, checkoutSession.getTrackerToken());
        return checkoutSession;
    }

    /**
     * Called both from the /verify-safepay polling endpoint (after the customer
     * returns from checkout) and from the webhook — safe to call more than once
     * for the same tracker (idempotent).
     */
    @Transactional
    public PaymentResponse verifySafePayPayment(String trackerToken) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(trackerToken)
                .orElseThrow(() -> new RuntimeException("Payment not found for tracker: " + trackerToken));

        Order order = payment.getOrder();

        // Idempotency check: If payment is already SUCCESS, return immediately
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            log.info("SafePay payment already processed as SUCCESS for order ID {}, tracker {}", order.getId(), trackerToken);
            return paymentMapper.toResponse(payment);
        }

        var statusResponse = safePayService.getTrackerStatus(trackerToken);

        if (safePayService.isPaymentSuccessful(statusResponse)) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            orderService.updateOrderStatus(order.getId(), OrderStatus.CONFIRMED);

            // Clear cart only after payment confirmation
            if (order.getUser() != null) {
                cartService.clearCart(order.getUser().getId().toString());
                log.info("Cleared cart for user ID {} after successful payment verification.", order.getUser().getId());
            }

            log.info("SafePay payment verified SUCCESS for order ID {}, tracker {}. Fulfillment OrderStatus -> PROCESSING.", order.getId(), trackerToken);
        } else {
            // Payment failed or cancelled
            payment.setPaymentStatus(PaymentStatus.FAILED);
            orderService.updateOrderStatus(order.getId(), OrderStatus.CANCELLED);
            log.warn("SafePay payment failed for order ID {}, tracker {}. Fulfillment OrderStatus -> CANCELLED.", order.getId(), trackerToken);
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse processRefund(Long orderId, com.ecommerce.application.dto.request.RefundRequest request) {
        Order order = orderService.getOrderEntityById(orderId);
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO)
                        .currency("PKR")
                        .paymentStatus(PaymentStatus.SUCCESS)
                        .build());

        BigDecimal currentRefunded = payment.getRefundedAmount() != null ? payment.getRefundedAmount() : BigDecimal.ZERO;
        BigDecimal originalAmount = (payment.getAmount() != null && payment.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? payment.getAmount()
                : (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        BigDecimal remainingRefundable = originalAmount.subtract(currentRefunded);

        if (remainingRefundable.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("This payment has already been fully refunded.");
        }

        BigDecimal refundAmount = (request != null && request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? request.getAmount()
                : remainingRefundable;

        if (refundAmount.compareTo(remainingRefundable) > 0) {
            throw new RuntimeException("Refund amount (Rs. " + refundAmount + ") exceeds remaining refundable balance (Rs. " + remainingRefundable + ").");
        }

        boolean isManual = request != null && Boolean.TRUE.equals(request.getIsManualOverride());
        if (!isManual && payment.getStripePaymentIntentId() != null && !payment.getStripePaymentIntentId().isBlank()) {
            safePayService.refundPayment(payment.getStripePaymentIntentId(), refundAmount);
        }

        BigDecimal updatedRefundedAmount = currentRefunded.add(refundAmount);
        payment.setRefundedAmount(updatedRefundedAmount);
        if (request != null && request.getReason() != null && !request.getReason().isBlank()) {
            payment.setRefundReason(request.getReason().trim());
        }

        if (updatedRefundedAmount.compareTo(originalAmount) >= 0) {
            payment.setPaymentStatus(PaymentStatus.REFUNDED);
            if (order.getStatus() != OrderStatus.CANCELLED) {
                orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
            }
        } else {
            payment.setPaymentStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }

        paymentRepository.save(payment);
        log.info("Processed refund of Rs. {} for order ID {}. Final PaymentStatus: {}", refundAmount, orderId, payment.getPaymentStatus());
        return paymentMapper.toResponse(payment);
    }
}