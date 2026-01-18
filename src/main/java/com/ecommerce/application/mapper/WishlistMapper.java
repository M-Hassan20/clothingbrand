package com.ecommerce.application.mapper;

import com.ecommerce.application.dto.response.WishlistItemResponse;
import com.ecommerce.application.dto.response.WishlistResponse;
import com.ecommerce.application.entity.Wishlist;
import com.ecommerce.application.entity.WishlistItem;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", uses = {ProductVariantMapper.class})
public interface WishlistMapper {

    @Mapping(target = "items", source = "items")
    WishlistResponse toResponse(Wishlist wishlist);

    @Mapping(target = "productVariant", source = "productVariant")
    @Mapping(target = "productName", source = "productVariant.product.name")
    @Mapping(target = "addedAt", source = "createdAt")
    WishlistItemResponse toWishlistItemResponse(WishlistItem wishlistItem);

    List<WishlistItemResponse> toWishlistItemResponseList(List<WishlistItem> items);
}