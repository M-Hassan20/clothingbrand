package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.postex.PostExBookingRequest;
import com.ecommerce.application.dto.postex.PostExBookingResponse;
import com.ecommerce.application.dto.postex.PostExShipperAdviceRequest;
import com.ecommerce.application.dto.postex.PostExTrackingResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.entity.Address;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.OrderItem;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.mapper.OrderMapper;
import com.ecommerce.application.repository.OrderItemRepository;
import com.ecommerce.application.repository.OrderRepository;
import com.ecommerce.application.repository.PaymentRepository;
import com.ecommerce.application.service.PostExService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostExServiceImpl implements PostExService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final OrderMapper orderMapper;
    private final OrderService orderService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${postex.api.token:YOUR_POSTEX_TOKEN_HERE}")
    private String apiToken;

    @Value("${postex.base-url:https://api.postex.pk}")
    private String baseUrl;

    @Value("${postex.default.city:Karachi}")
    private String defaultCity;

    @Value("${postex.default.pickup-address-code:001}")
    private String defaultPickupAddressCode;

    @Override
    @Transactional
    public OrderResponse bookShipment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        PostExBookingResponse bookingResponse = createPostExOrder(order);

        if (bookingResponse != null && bookingResponse.getDist() != null && bookingResponse.getDist().getTrackingNumber() != null) {
            String trackingNumber = bookingResponse.getDist().getTrackingNumber();
            order.setTrackingNumber(trackingNumber);
            order.setCourierName("PostEx");
            order.setPostexStatus("BOOKED");
            order.setPickupAddressCode(defaultPickupAddressCode);
            order.setStatus(OrderStatus.SHIPPED);
            orderRepository.save(order);
            log.info("Successfully booked PostEx shipment for orderId: {}, trackingNumber: {}", orderId, trackingNumber);
        } else {
            String msg = (bookingResponse != null && bookingResponse.getStatusMessage() != null)
                    ? bookingResponse.getStatusMessage()
                    : "Failed to book shipment with PostEx";
            log.error("PostEx booking failed for orderId: {}. Reason: {}", orderId, msg);
            throw new RuntimeException("PostEx Booking Failed: " + msg);
        }

        return orderService.enrichOrderResponse(orderMapper.toResponse(order));
    }

    @Override
    public PostExBookingResponse createPostExOrder(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrder(order);

        int totalItemsCount = items.stream()
                .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 1)
                .sum();
        if (totalItemsCount == 0) totalItemsCount = 1;

        String itemDetails = items.stream()
                .map(item -> item.getQuantity() + "x " + item.getProductNameSnapshot())
                .collect(Collectors.joining(", "));
        if (itemDetails.isBlank()) {
            itemDetails = "Clothing Items";
        }

        Address address = order.getShippingAddress();
        String customerName = order.getUser() != null && order.getUser().getFullName() != null
                ? order.getUser().getFullName() : "Customer";
        String customerPhone = order.getUser() != null && order.getUser().getPhone() != null
                ? order.getUser().getPhone() : "03000000000";

        String deliveryAddressStr = (address != null && address.getStreet() != null)
                ? address.getStreet() : "Main Address";
        String cityStr = (address != null && address.getCity() != null && !address.getCity().isBlank())
                ? address.getCity() : defaultCity;

        boolean isPaidOnline = paymentRepository.findByOrderId(order.getId())
                .map(payment -> payment.getPaymentStatus() == PaymentStatus.SUCCESS)
                .orElse(false);

        boolean isZeroAmountOrder = order.getTotalAmount() != null && order.getTotalAmount().compareTo(BigDecimal.ZERO) == 0;

        BigDecimal invoicePayment = (isPaidOnline || isZeroAmountOrder)
                ? BigDecimal.ZERO
                : (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);

        boolean isExchangeReplacement = order.getDiscountCode() != null && order.getDiscountCode().contains("EXCHANGE-REPLACEMENT");
        String orderType = isExchangeReplacement ? "Replacement" : "Normal";

        PostExBookingRequest request = PostExBookingRequest.builder()
                .cityName(cityStr)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .deliveryAddress(deliveryAddressStr)
                .invoicePayment(invoicePayment)
                .orderDetail(itemDetails)
                .orderRefNumber("ORD-" + order.getId())
                .orderType(orderType)
                .pickupAddressCode(defaultPickupAddressCode)
                .items(totalItemsCount)
                .transactionNotes(isExchangeReplacement ? "Size Exchange Replacement - 0 COD" : "Handle with care")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("token", apiToken);

        HttpEntity<PostExBookingRequest> entity = new HttpEntity<>(request, headers);

        String endpointUrl = baseUrl + "/services/integration/api/order/v3/create-order";

        try {
            log.info("Sending PostEx Create Order Request to {}: {}", endpointUrl, request);
            ResponseEntity<PostExBookingResponse> response = restTemplate.postForEntity(
                    endpointUrl, entity, PostExBookingResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error creating PostEx order: ", e);
            throw new RuntimeException("PostEx API Error: " + e.getMessage(), e);
        }
    }

    @Override
    public PostExTrackingResponse trackShipment(String queryStr) {
        String trackingNumber = queryStr != null ? queryStr.trim() : "";

        // If query is an Order ID (numeric or ORD-prefix), look up the order first
        if (trackingNumber.matches("\\d+") || trackingNumber.toUpperCase().startsWith("ORD-")) {
            String cleanId = trackingNumber.toUpperCase().replace("ORD-", "").trim();
            try {
                Long orderId = Long.parseLong(cleanId);
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    if (order.getTrackingNumber() != null && !order.getTrackingNumber().isBlank()) {
                        trackingNumber = order.getTrackingNumber();
                    } else {
                        // Order exists but hasn't been booked with courier yet
                        PostExTrackingResponse.TrackingDistData dist = new PostExTrackingResponse.TrackingDistData();
                        dist.setOrderRefNumber("ORD-" + order.getId());
                        dist.setTransactionStatus("ORDER " + order.getStatus().toString() + " (Pending Courier Dispatch)");
                        dist.setTransactionStatusId(order.getStatus().toString());
                        dist.setCustomerName(order.getUser() != null ? order.getUser().getFullName() : "Customer");
                        dist.setCityName(order.getShippingAddress() != null ? order.getShippingAddress().getCity() : defaultCity);
                        dist.setInvoicePayment(order.getTotalAmount());
                        return new PostExTrackingResponse("200", "Order Found", dist);
                    }
                }
            } catch (Exception ignored) {}
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("token", apiToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String endpointUrl = baseUrl + "/services/integration/api/order/v1/track-order/" + trackingNumber;

        try {
            ResponseEntity<PostExTrackingResponse> response = restTemplate.exchange(
                    endpointUrl, HttpMethod.GET, entity, PostExTrackingResponse.class);

            PostExTrackingResponse trackingResponse = response.getBody();
            if (trackingResponse != null && trackingResponse.getDist() != null) {
                String latestStatus = trackingResponse.getDist().getTransactionStatus();
                orderRepository.findByTrackingNumber(trackingNumber).ifPresent(order -> {
                    if (latestStatus != null && !latestStatus.isBlank()) {
                        order.setPostexStatus(latestStatus);
                        if ("Delivered".equalsIgnoreCase(latestStatus) || "0005".equals(trackingResponse.getDist().getTransactionStatusId())) {
                            order.setStatus(OrderStatus.DELIVERED);
                        }
                        orderRepository.save(order);
                    }
                });
            }

            return trackingResponse;
        } catch (Exception e) {
            log.error("Error tracking PostEx shipment {}: ", trackingNumber, e);
            throw new RuntimeException("PostEx Tracking Error: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] downloadAirwayBillPdf(String trackingNumber) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("token", apiToken);
        headers.setAccept(List.of(MediaType.APPLICATION_PDF, MediaType.APPLICATION_OCTET_STREAM, MediaType.APPLICATION_JSON, MediaType.ALL));

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String endpointUrl = baseUrl + "/services/integration/api/order/v1/get-invoice?trackingNumbers=" + trackingNumber;

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    endpointUrl, HttpMethod.GET, entity, byte[].class);

            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                throw new RuntimeException("PostEx API returned empty response for airway bill invoice");
            }

            String responseStr = new String(body, java.nio.charset.StandardCharsets.UTF_8).trim();
            if (responseStr.startsWith("{") && responseStr.contains("dist")) {
                try {
                    com.fasterxml.jackson.databind.JsonNode jsonNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(responseStr);
                    if (jsonNode.has("dist") && !jsonNode.get("dist").isNull()) {
                        String base64Pdf = jsonNode.get("dist").asText();
                        return java.util.Base64.getDecoder().decode(base64Pdf);
                    }
                } catch (Exception jsonEx) {
                    log.warn("Failed to parse PostEx airway bill JSON payload: {}", jsonEx.getMessage());
                }
            }

            return body;
        } catch (Exception e) {
            log.error("Error downloading PostEx airway bill PDF for {}: ", trackingNumber, e);
            throw new RuntimeException("PostEx Airway Bill Download Error: " + e.getMessage(), e);
        }
    }


    @Override
    public boolean cancelShipment(String trackingNumber) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("token", apiToken);

        Map<String, String> body = Map.of("trackingNumber", trackingNumber);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        String endpointUrl = baseUrl + "/services/integration/api/order/v1/cancel-order";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    endpointUrl, HttpMethod.PUT, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                orderRepository.findByTrackingNumber(trackingNumber).ifPresent(order -> {
                    order.setPostexStatus("CANCELLED");
                    order.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(order);
                });
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error cancelling PostEx shipment {}: ", trackingNumber, e);
            throw new RuntimeException("PostEx Cancel Order Error: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean submitShipperAdvice(PostExShipperAdviceRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("token", apiToken);

        HttpEntity<PostExShipperAdviceRequest> entity = new HttpEntity<>(request, headers);

        String endpointUrl = baseUrl + "/services/integration/api/order/v2/save-shipper-advice";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    endpointUrl, HttpMethod.PUT, entity, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Error submitting PostEx shipper advice: ", e);
            throw new RuntimeException("PostEx Shipper Advice Error: " + e.getMessage(), e);
        }
    }
}
