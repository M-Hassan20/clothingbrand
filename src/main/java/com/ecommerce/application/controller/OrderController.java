package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.OrderCreateRequest;
import com.ecommerce.application.dto.request.GuestCheckoutRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.OrderItemResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.service.impl.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getUserOrders(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getUserOrders(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("All User Orders", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<ApiResponse<List<OrderItemResponse>>> getOrderItems(@PathVariable Long id) {
        List<OrderItemResponse> items = orderService.getOrderItems(id);
        return ResponseEntity.ok(ApiResponse.success("Order items retrieved successfully!", items));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @RequestParam Long userId,
            @Valid @RequestBody OrderCreateRequest request) {

        OrderResponse order = orderService.createOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Order Created successfully!", order));
    }

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<OrderResponse>> createGuestOrder(
            @Valid @RequestBody GuestCheckoutRequest request) {

        OrderResponse order = orderService.createGuestOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Guest Order Created successfully!", order));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestParam Long userId) {

        OrderResponse order = orderService.cancelOrder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully!", order));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByStatus(
            @PathVariable OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders = orderService.getOrdersByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Order by status: " + status, orders));
    }
}