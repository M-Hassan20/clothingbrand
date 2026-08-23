package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.service.impl.InvoiceService;
import com.ecommerce.application.service.impl.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminOrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.success("All orders retrieved", orders));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getPendingOrders() {
        List<OrderResponse> orders = orderService.getPendingOrders();
        return ResponseEntity.ok(ApiResponse.success("Pending orders retrieved", orders));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders() {
        List<OrderResponse> orders = orderService.getRecentOrders();
        return ResponseEntity.ok(ApiResponse.success("Recent orders retrieved", orders));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        OrderResponse order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", order));
    }

    @GetMapping("/analytics/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueAnalytics(
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {

        if (startDate == null) {
            startDate = LocalDateTime.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }

        BigDecimal revenue = orderService.calculateRevenue(startDate, endDate);

        Map<String, Object> analytics = Map.of(
                "startDate", startDate,
                "endDate", endDate,
                "totalRevenue", revenue
        );

        return ResponseEntity.ok(ApiResponse.success("Revenue analytics retrieved", analytics));
    }

    @GetMapping("/analytics/status-counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOrderStatusCounts() {
        Map<String, Long> counts = Map.of(
                "PENDING", orderService.getOrderCountByStatus(OrderStatus.PENDING),
                "PROCESSING", orderService.getOrderCountByStatus(OrderStatus.PROCESSING),
                "CONFIRMED", orderService.getOrderCountByStatus(OrderStatus.CONFIRMED),
                "SHIPPED", orderService.getOrderCountByStatus(OrderStatus.SHIPPED),
                "DELIVERED", orderService.getOrderCountByStatus(OrderStatus.DELIVERED),
                "CANCELLED", orderService.getOrderCountByStatus(OrderStatus.CANCELLED)
        );

        return ResponseEntity.ok(ApiResponse.success("Order status counts retrieved", counts));
    }

    /**
     * Generate invoice for order
     */
    @GetMapping("/{orderId}/invoice")
    public ResponseEntity<byte[]> generateInvoice(@PathVariable Long orderId) throws IOException {
        byte[] invoicePdf = invoiceService.generateInvoice(orderId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "invoice_" + orderId + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(invoicePdf);
    }
}