package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.request.ProductCreateRequest;
import com.ecommerce.application.dto.request.ProductUpdateRequest;
import com.ecommerce.application.dto.response.ProductDetailResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.repository.ProductVariantRepository;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class, ProductVariantMapper.class})
public abstract class ProductMapper {

    @Autowired
    protected ProductVariantRepository productVariantRepository;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "category", source = "categoryId", qualifiedByName = "categoryIdToCategory")
    @Mapping(target = "isActive", defaultValue = "true")
    public abstract Product toEntity(ProductCreateRequest request);

    @Mapping(target = "category", source = "category")
    @Mapping(target = "minPrice", expression = "java(calculateMinPrice(product))")
    @Mapping(target = "maxPrice", expression = "java(calculateMaxPrice(product))")
    @Mapping(target = "thumbnailImage", expression = "java(getFirstImage(product))")
    @Mapping(target = "status", expression = "java(determineStatus(product))")
    @Mapping(target = "averageRating", ignore = true) // Set in service
    @Mapping(target = "reviewCount", ignore = true) // Set in service
    public abstract ProductResponse toResponse(Product product);

    @Mapping(target = "variants", ignore = true) // Set in service
    @Mapping(target = "availableSizes", ignore = true) // Set in service
    @Mapping(target = "availableColors", ignore = true) // Set in service
    @Mapping(target = "averageRating", ignore = true) // Set in service
    @Mapping(target = "reviewCount", ignore = true) // Set in service
    public abstract ProductDetailResponse toDetailResponse(Product product);

    public abstract List<ProductResponse> toResponseList(List<Product> products);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "category", source = "categoryId", qualifiedByName = "categoryIdToCategory")
    public abstract void updateEntityFromRequest(ProductUpdateRequest request, @MappingTarget Product product);

    @Named("categoryIdToCategory")
    protected Category categoryIdToCategory(Long categoryId) {
        if(categoryId == null) return null;
        Category category = new Category();
        category.setId(categoryId);
        return category;
    }

    protected BigDecimal calculateMinPrice(Product product) {
        if (product == null || product.getId() == null) {
            return BigDecimal.ZERO;
        }
        return productVariantRepository.findByProductId(product.getId()).stream()
                .map(ProductVariant::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    protected BigDecimal calculateMaxPrice(Product product) {
        if (product == null || product.getId() == null) {
            return BigDecimal.ZERO;
        }
        return productVariantRepository.findByProductId(product.getId()).stream()
                .map(ProductVariant::getPrice)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    protected String getFirstImage(Product product) {
        if (product == null) {
            return null;
        }
        if (product.getThumbnailImage() != null && !product.getThumbnailImage().isEmpty()) {
            return product.getThumbnailImage();
        }
        return productVariantRepository.findByProductId(product.getId()).stream()
                .map(ProductVariant::getPublicImageUrl)
                .filter(url -> url != null && !url.isEmpty())
                .findFirst()
                .orElse(null);
    }

    protected String determineStatus(Product product) {
        if (product == null) return null;
        if (product.getStatus() != null) {
            return product.getStatus().name();
        }
        return Boolean.TRUE.equals(product.getIsActive()) ? "ACTIVE" : "DRAFT";
    }
}
