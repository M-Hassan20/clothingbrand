package com.ecommerce.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageUploadResponse {
    private String fileName;
    private String fileUrl;
    private String thumbnailUrl;
    private Long fileSize;
    private String contentType;
    private Integer width;
    private Integer height;
}