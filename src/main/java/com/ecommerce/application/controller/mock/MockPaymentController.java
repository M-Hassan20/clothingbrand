package com.ecommerce.application.controller.mock;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.Payment;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.repository.PaymentRepository;
import com.ecommerce.application.service.impl.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/mock")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.jazzcash.enabled", havingValue = "false", matchIfMissing = true)
@CrossOrigin(origins = "*")
public class MockPaymentController {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;

    /**
     * Simulates a successful payment instantly - FOR DEVELOPMENT ONLY
     */
    @PostMapping("/pay/{orderId}")
    public ResponseEntity<ApiResponse<String>> mockPay(@PathVariable Long orderId) {
        Order order = orderService.getOrderEntityById(orderId);
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .currency("PKR")
                        .build());
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
        return ResponseEntity.ok(ApiResponse.success("Mock payment successful", "Order confirmed"));
    }
}