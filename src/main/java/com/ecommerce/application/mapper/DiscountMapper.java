package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.request.DiscountRequest;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Discount;
import com.ecommerce.application.entity.Product;
import org.mapstruct.*;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface DiscountMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "currentUsageCount", constant = "0")
    @Mapping(target = "isActive", defaultValue = "true")
    @Mapping(target = "applicableCategories", source = "applicableCategoryIds", qualifiedByName = "categoryIdsToCategories")
    @Mapping(target = "applicableProducts", source = "applicableProductIds", qualifiedByName = "productIdsToProducts")
    Discount toEntity(DiscountRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "currentUsageCount", ignore = true)
    @Mapping(target = "applicableCategories", source = "applicableCategoryIds", qualifiedByName = "categoryIdsToCategories")
    @Mapping(target = "applicableProducts", source = "applicableProductIds", qualifiedByName = "productIdsToProducts")
    void updateEntityFromRequest(DiscountRequest request, @MappingTarget Discount discount);

    @Named("categoryIdsToCategories")
    default Set<Category> categoryIdsToCategories(Set<Long> categoryIds) {
        if (categoryIds == null) return null;
        return categoryIds.stream()
                .map(id -> {
                    Category category = new Category();
                    category.setId(id);
                    return category;
                })
                .collect(Collectors.toSet());
    }

    @Named("productIdsToProducts")
    default Set<Product> productIdsToProducts(Set<Long> productIds) {
        if (productIds == null) return null;
        return productIds.stream()
                .map(id -> {
                    Product product = new Product();
                    product.setId(id);
                    return product;
                })
                .collect(Collectors.toSet());
    }
}