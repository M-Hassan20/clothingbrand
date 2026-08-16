package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.request.OrderCreateRequest;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.entity.Order;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public interface OrderMapper {

//    @Mapping(target = "items", source = "items")
    @Mapping(target = "shippingAddress", source = "shippingAddress")
    @Mapping(target = "userId", source = "order.user.id")
    @Mapping(target = "userEmail", source = "order.user.email")
    @Mapping(target = "userFullName", source = "order.user.fullName")
    OrderResponse toResponse(Order order);

    List<OrderResponse> toResponseList(List<Order> orders);
}