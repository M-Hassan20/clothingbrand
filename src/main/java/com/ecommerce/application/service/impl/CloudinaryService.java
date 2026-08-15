package com.ecommerce.application.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.ecommerce.application.dto.response.ImageUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${image.max-size:10485760}")
    private Long maxFileSize;

    @Value("${image.allowed-formats:jpg,jpeg,png,webp}")
    private String allowedFormats;

    /**
     * Upload image to Cloudinary
     */
    public ImageUploadResponse uploadImage(MultipartFile file, String folder, String entityId) throws IOException {
        validateImage(file);

        String publicId = folder + "/" + entityId + "/" + UUID.randomUUID();

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "image"
        ));

        String secureUrl = (String) uploadResult.get("secure_url");
        Integer width = (Integer) uploadResult.get("width");
        Integer height = (Integer) uploadResult.get("height");

        // Cloudinary transformation URL for thumbnail — no separate upload needed!
        String thumbnailUrl = secureUrl.replace("/upload/", "/upload/w_300,h_300,c_fill/");

        return ImageUploadResponse.builder()
                .fileName(publicId)
                .fileUrl(secureUrl)
                .thumbnailUrl(thumbnailUrl)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .width(width)
                .height(height)
                .build();
    }

    public List<ImageUploadResponse> uploadImages(List<MultipartFile> files, String folder, String entityId) throws IOException {
        List<ImageUploadResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            responses.add(uploadImage(file, folder, entityId));
        }
        return responses;
    }

    /**
     * Delete image using its public_id (extracted from the stored URL)
     */
    public boolean deleteImage(String imageUrl) {
        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId == null) return false;

            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return "ok".equals(result.get("result"));
        } catch (Exception e) {
            System.err.println("Error deleting image: " + e.getMessage());
            return false;
        }
    }

    public void deleteImages(List<String> imageUrls) {
        imageUrls.forEach(this::deleteImage);
    }

    /**
     * Delete all images under a folder (by prefix)
     */
    public void deleteFolder(String folder, String entityId) {
        try {
            cloudinary.api().deleteResourcesByPrefix(folder + "/" + entityId + "/", ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.err.println("Error deleting folder: " + e.getMessage());
        }
    }

    private void validateImage(MultipartFile file) {
        if (file.isEmpty()) throw new RuntimeException("File is empty");

        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds maximum allowed size of " +
                    (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("File must be an image");
        }

        String extension = contentType.substring(contentType.lastIndexOf("/") + 1);
        List<String> allowed = Arrays.asList(allowedFormats.split(","));
        if (!allowed.contains(extension.toLowerCase())) {
            throw new RuntimeException("File format not allowed. Allowed formats: " + allowedFormats);
        }
    }

    /**
     * Extract public_id from a Cloudinary secure_url so we can delete it later
     * e.g. https://res.cloudinary.com/xxx/image/upload/v123456/products/1/uuid.jpg
     *      -> products/1/uuid
     */
    private String extractPublicIdFromUrl(String url) {
        try {
            String afterUpload = url.split("/upload/")[1];
            // Strip version prefix (v123456/) if present
            if (afterUpload.matches("^v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }
            // Strip file extension
            int lastDot = afterUpload.lastIndexOf(".");
            return lastDot > 0 ? afterUpload.substring(0, lastDot) : afterUpload;
        } catch (Exception e) {
            return null;
        }
    }
}