package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.request.ProductCreateRequest;
import com.ecommerce.application.dto.request.ProductUpdateRequest;
import com.ecommerce.application.dto.response.ProductDetailResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class, ProductVariantMapper.class})
public interface ProductMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "category", source = "categoryId", qualifiedByName = "categoryIdToCategory")
    @Mapping(target = "isActive", defaultValue = "true")
    Product toEntity(ProductCreateRequest request);

    @Mapping(target = "category", source = "category")
    @Mapping(target = "minPrice", expression = "java(calculateMinPrice(product))")
    @Mapping(target = "maxPrice", expression = "java(calculateMaxPrice(product))")
    @Mapping(target = "thumbnailImage", expression = "java(getFirstImage(product))")
    @Mapping(target = "averageRating", ignore = true) // Set in service
    @Mapping(target = "reviewCount", ignore = true) // Set in service
    ProductResponse toResponse(Product product);

    @Mapping(target = "variants", ignore = true) // Set in service
    @Mapping(target = "availableSizes", ignore = true) // Set in service
    @Mapping(target = "availableColors", ignore = true) // Set in service
    @Mapping(target = "averageRating", ignore = true) // Set in service
    @Mapping(target = "reviewCount", ignore = true) // Set in service
    ProductDetailResponse toDetailResponse(Product product);

    List<ProductResponse> toResponseList(List<Product> products);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "category", source = "categoryId", qualifiedByName = "categoryIdToCategory")
    void updateEntityFromRequest(ProductUpdateRequest request, @MappingTarget Product product);

    @Named("categoryIdToCategory")
    default Category categoryIdToCategory(Long categoryId) {
        if(categoryId == null) return null;
        Category category = new Category();
        category.setId(categoryId);
        return category;
    }

    default BigDecimal calculateMinPrice(Product product) {
//        Implemented in service
        return BigDecimal.ZERO;
    }

    default BigDecimal calculateMaxPrice(Product product) {
//        Implemented in service
        return BigDecimal.ZERO;
    }

    default String getFirstImage(Product product) {
        //Implemented in service
        return null;
    }


}
