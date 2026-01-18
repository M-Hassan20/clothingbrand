package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.response.OrderItemResponse;
import com.ecommerce.application.entity.OrderItem;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {

    @Mapping(target = "productName", source = "productNameSnapshot")
    @Mapping(target = "size", source = "productVariant.size")
    @Mapping(target = "color", source = "productVariant.color")
    @Mapping(target = "price", source = "priceSnapshot")
    @Mapping(target = "subtotal", expression = "java(calculateSubtotal(orderItem))")
    OrderItemResponse toResponse(OrderItem orderItem);

    List<OrderItemResponse> toResponseList(List<OrderItem> orderItems);

    default BigDecimal calculateSubtotal(OrderItem orderItem) {
        if (orderItem.getPriceSnapshot() == null || orderItem.getQuantity() == null) {
            return BigDecimal.ZERO;
        }
        return orderItem.getPriceSnapshot().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
    }
}