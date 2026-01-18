package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.response.UserResponse;
import com.ecommerce.application.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);
}