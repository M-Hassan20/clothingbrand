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
    OrderResponse toResponse(Order order);

    List<OrderResponse> toResponseList(List<Order> orders);
}