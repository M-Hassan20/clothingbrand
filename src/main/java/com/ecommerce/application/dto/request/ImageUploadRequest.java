package com.ecommerce.application.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadRequest {
    private String folder; // "products", "variants", "users"
    private String entityId; // Product ID, Variant ID, etc.
    private Boolean generateThumbnail = true;
}