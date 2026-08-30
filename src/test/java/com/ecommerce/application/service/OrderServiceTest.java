package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.GuestCheckoutRequest;
import com.ecommerce.application.dto.request.OrderCreateRequest;
import com.ecommerce.application.dto.request.OrderItemRequest;
import com.ecommerce.application.dto.response.AddressResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.enums.Role;
import com.ecommerce.application.mapper.OrderMapper;
import com.ecommerce.application.repository.OrderItemRepository;
import com.ecommerce.application.repository.OrderRepository;
import com.ecommerce.application.repository.PaymentRepository;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.service.impl.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ProductVariantServiceImpl productVariantService;
    @Mock private AddressService addressService;
    @Mock private DiscountService discountService;
    @Mock private UserService userService;
    @Mock private OrderMapper orderMapper;
    @Mock private EmailService emailService;
    @Mock private InvoiceService invoiceService;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_insufficientStock_throwsException() {
        OrderCreateRequest request = new OrderCreateRequest();
        OrderItemRequest item = new OrderItemRequest();
        item.setProductVariantId(1L);
        item.setQuantity(5);
        request.setItems(List.of(item));

        User user = User.builder().id(1L).email("user@test.com").fullName("Test User").build();
        Product product = Product.builder().name("Out of Stock Shirt").build();
        ProductVariant variant = ProductVariant.builder().id(1L).product(product).stockQuantity(2).build();

        when(userService.getUserEntityById(1L)).thenReturn(user);
        when(productVariantService.getVariantEntityById(1L)).thenReturn(variant);

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Insufficient stock for product: Out of Stock Shirt");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrder_sufficientStock_decrementsStockAndSavesOrder() {
        OrderCreateRequest request = new OrderCreateRequest();
        OrderItemRequest item = new OrderItemRequest();
        item.setProductVariantId(1L);
        item.setQuantity(2);
        request.setItems(List.of(item));

        User user = User.builder().id(1L).email("user@test.com").fullName("Test User").build();
        Product product = Product.builder().name("Shirt").build();
        ProductVariant variant = ProductVariant.builder().id(1L).product(product).price(BigDecimal.valueOf(50)).stockQuantity(10).build();

        when(userService.getUserEntityById(1L)).thenReturn(user);
        when(productVariantService.getVariantEntityById(1L)).thenReturn(variant);
        when(discountService.calculateEffectivePrice(variant)).thenReturn(BigDecimal.valueOf(50));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(100L);
            return o;
        });
        when(orderMapper.toResponse(any(Order.class))).thenReturn(new OrderResponse());

        orderService.createOrder(1L, request);

        verify(productVariantService).decreaseStock(1L, 2);
        verify(orderRepository).save(any(Order.class));
        verify(emailService).sendOrderConfirmationEmail(eq("user@test.com"), eq("Test User"), eq(100L), any());
    }

    @Test
    void updateOrderStatus_toCancelled_restoresStock() {
        Order order = Order.builder().id(100L).status(OrderStatus.PENDING).user(User.builder().email("user@test.com").fullName("Name").build()).build();
        ProductVariant variant = ProductVariant.builder().id(1L).build();
        OrderItem item = OrderItem.builder().productVariant(variant).quantity(3).build();

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderId(100L)).thenReturn(List.of(item));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus(100L, OrderStatus.CANCELLED);

        verify(productVariantService).increaseStock(1L, 3);
        verify(orderRepository).save(order);
    }

    @Test
    void cancelOrder_alreadyDelivered_throwsException() {
        Order order = Order.builder().id(100L).status(OrderStatus.DELIVERED).user(User.builder().id(1L).build()).build();
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(100L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot cancel order with status: DELIVERED");
    }

    @Test
    void cancelOrder_notOwnedByUser_throwsException() {
        Order order = Order.builder().id(100L).status(OrderStatus.PENDING).user(User.builder().id(2L).build()).build();
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(100L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("You are not authorized to cancel this order");
    }

    @Test
    void createGuestOrder_delegatesToCreateOrder() {
        GuestCheckoutRequest request = new GuestCheckoutRequest();
        request.setGuestEmail("guest@test.com");
        request.setGuestName("Guest");
        request.setGuestPhone("123");
        request.setShippingStreet("Street");
        request.setShippingCity("City");
        request.setShippingCountry("Country");
        request.setShippingZipCode("zip");
        request.setItems(Collections.emptyList());

        User guestUser = User.builder().id(15L).email("guest@test.com").role(Role.CUSTOMER).build();
        AddressResponse addressResponse = new AddressResponse();
        addressResponse.setId(200L);
        OrderResponse orderResponse = new OrderResponse();
        orderResponse.setId(300L);

        when(userService.findOrCreateGuestUser("guest@test.com", "Guest", "123")).thenReturn(guestUser);
        when(addressService.createAddress(eq(15L), any())).thenReturn(addressResponse);
        when(userService.getUserEntityById(15L)).thenReturn(guestUser);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(300L);
            return o;
        });
        when(orderMapper.toResponse(any(Order.class))).thenReturn(orderResponse);
        when(jwtUtil.generateToken("guest@test.com", 15L, "CUSTOMER")).thenReturn("guest-jwt-token");

        OrderResponse result = orderService.createGuestOrder(request);

        assertThat(result.getGuestToken()).isEqualTo("guest-jwt-token");
        verify(userService).findOrCreateGuestUser("guest@test.com", "Guest", "123");
        verify(addressService).createAddress(eq(15L), any());
    }
}
