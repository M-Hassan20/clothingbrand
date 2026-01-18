package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.request.ProductVariantRequest;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductVariantMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", source = "productId", qualifiedByName = "productIdToProduct")
    @Mapping(target = "isActive", defaultValue = "true")
    ProductVariant toEntity(ProductVariantRequest request);

    @Mapping(target = "inStock", expression = "java(variant.getStockQuantity() != null && variant.getStockQuantity() > 0)")
    ProductVariantResponse toResponse(ProductVariant variant);

    List<ProductVariantResponse> toResponseList(List<ProductVariant> variants);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", source = "productId", qualifiedByName = "productIdToProduct")
    void updateEntityFromRequest(ProductVariantRequest request, @MappingTarget ProductVariant variant);

    @Named("productIdToProduct")
    default Product productIdToProduct(Long productId) {
        if(productId == null) return null;
        Product product = new Product();
        product.setId(productId);
        return product;
    }


}
