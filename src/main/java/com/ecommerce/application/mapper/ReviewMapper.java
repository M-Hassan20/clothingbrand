package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.request.ReviewCreateRequest;
import com.ecommerce.application.dto.response.ReviewResponse;
import com.ecommerce.application.entity.Review;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ReviewMapper {

    @Mapping(target = "user", source = "user")
    ReviewResponse toResponse(Review review);

    List<ReviewResponse> toResponseList(List<Review> reviews);
}