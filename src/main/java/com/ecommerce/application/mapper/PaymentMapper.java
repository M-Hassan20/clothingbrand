package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.response.PaymentResponse;
import com.ecommerce.application.entity.Payment;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    PaymentResponse toResponse(Payment payment);
}