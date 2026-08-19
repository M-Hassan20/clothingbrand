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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final PaymentMapper paymentMapper;
    private final SafePayService safePayService;

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
        Order order = orderService.getOrderEntityById(orderId);

        var checkoutSession = safePayService.createCheckoutSession(orderId, order.getTotalAmount(), "MPGS");
        // "MPGS" confirmed working from your test run — swap to "CYBERSOURCE", "PAYFAST",
        // or "RAAST" later if you want to offer customers a choice of rails

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("PKR")
                .paymentStatus(PaymentStatus.PENDING)
                .stripePaymentIntentId(checkoutSession.getTrackerToken()) // reused field, stores SafePay tracker token
                .build();

        paymentRepository.save(payment);
        return checkoutSession;
    }

    /**
     * Called both from the /verify-safepay polling endpoint (after the customer
     * returns from checkout) and from the webhook — safe to call more than once
     * for the same tracker, it just re-confirms the same end state each time.
     */
    @Transactional
    public PaymentResponse verifySafePayPayment(String trackerToken) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(trackerToken)
                .orElseThrow(() -> new RuntimeException("Payment not found for tracker: " + trackerToken));

        var statusResponse = safePayService.getTrackerStatus(trackerToken);

        if (safePayService.isPaymentSuccessful(statusResponse)) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            orderService.updateOrderStatus(payment.getOrder().getId(), OrderStatus.CONFIRMED);
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

}