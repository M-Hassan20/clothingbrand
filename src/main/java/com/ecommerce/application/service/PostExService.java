package com.ecommerce.application.service;

import com.ecommerce.application.dto.postex.PostExBookingResponse;
import com.ecommerce.application.dto.postex.PostExShipperAdviceRequest;
import com.ecommerce.application.dto.postex.PostExTrackingResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.entity.Order;

public interface PostExService {
    OrderResponse bookShipment(Long orderId);
    PostExBookingResponse createPostExOrder(Order order);
    PostExTrackingResponse trackShipment(String trackingNumber);
    byte[] downloadAirwayBillPdf(String trackingNumber);
    boolean cancelShipment(String trackingNumber);
    boolean submitShipperAdvice(PostExShipperAdviceRequest request);
}
