//package com.ecommerce.application.service.impl;
//
//import com.ecommerce.application.dto.response.ImageUploadResponse;
//import com.google.cloud.storage.Blob;
//import com.google.cloud.storage.BlobId;
//import com.google.cloud.storage.BlobInfo;
//import com.google.cloud.storage.Bucket;
//import lombok.RequiredArgsConstructor;
//import org.apache.commons.io.FilenameUtils;
//import org.imgscalr.Scalr;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import javax.imageio.ImageIO;
//import java.awt.image.BufferedImage;
//import java.io.ByteArrayInputStream;
//import java.io.ByteArrayOutputStream;
//import java.io.IOException;
//import java.util.*;
//import java.util.concurrent.TimeUnit;
//
//@Service
//@RequiredArgsConstructor
//public class FirebaseStorageService {
//
//    private final Bucket firebaseBucket;
//
//    @Value("${firebase.storage.bucket}")
//    private String bucketName;
//
//    @Value("${image.max-size:10485760}") // 10MB default
//    private Long maxFileSize;
//
//    @Value("${image.allowed-formats:jpg,jpeg,png,webp}")
//    private String allowedFormats;
//
//    @Value("${image.thumbnail-size:300}")
//    private Integer thumbnailSize;
//
//    @Value("${image.medium-size:800}")
//    private Integer mediumSize;
//
//    @Value("${image.large-size:1200}")
//    private Integer largeSize;
//
//    /**
//     * Upload image to Firebase Storage
//     */
//    public ImageUploadResponse uploadImage(MultipartFile file, String folder, String entityId) throws IOException {
//        // Validate file
//        validateImage(file);
//
//        // Generate unique filename
//        String originalFilename = file.getOriginalFilename();
//        String extension = FilenameUtils.getExtension(originalFilename);
//        String uniqueFilename = generateUniqueFilename(entityId, extension);
//
//        // Create path: folder/entityId/filename
//        String path = String.format("%s/%s/%s", folder, entityId, uniqueFilename);
//
//        // Read image and get dimensions
//        BufferedImage originalImage = ImageIO.read(file.getInputStream());
//        int width = originalImage.getWidth();
//        int height = originalImage.getHeight();
//
//        // Resize if too large
//        BufferedImage processedImage = resizeImage(originalImage, largeSize);
//        byte[] imageBytes = bufferedImageToBytes(processedImage, extension);
//
//        // Upload main image
//        String imageUrl = uploadToFirebase(imageBytes, path, file.getContentType());
//
//        // Generate and upload thumbnail
//        String thumbnailUrl = null;
//        if (thumbnailSize != null && thumbnailSize > 0) {
//            BufferedImage thumbnail = resizeImage(originalImage, thumbnailSize);
//            byte[] thumbnailBytes = bufferedImageToBytes(thumbnail, extension);
//            String thumbnailPath = String.format("%s/%s/thumb_%s", folder, entityId, uniqueFilename);
//            thumbnailUrl = uploadToFirebase(thumbnailBytes, thumbnailPath, file.getContentType());
//        }
//
//        return ImageUploadResponse.builder()
//                .fileName(uniqueFilename)
//                .fileUrl(imageUrl)
//                .thumbnailUrl(thumbnailUrl)
//                .fileSize(file.getSize())
//                .contentType(file.getContentType())
//                .width(width)
//                .height(height)
//                .build();
//    }
//
//    /**
//     * Upload multiple images
//     */
//    public List<ImageUploadResponse> uploadImages(List<MultipartFile> files, String folder, String entityId) throws IOException {
//        List<ImageUploadResponse> responses = new ArrayList<>();
//        for (MultipartFile file : files) {
//            responses.add(uploadImage(file, folder, entityId));
//        }
//        return responses;
//    }
//
//    /**
//     * Delete image from Firebase Storage
//     */
//    public boolean deleteImage(String imageUrl) {
//        try {
//            String fileName = extractFileNameFromUrl(imageUrl);
//            if (fileName == null) return false;
//
//            BlobId blobId = BlobId.of(bucketName, fileName);
//            return firebaseBucket.getStorage().delete(blobId);
//        } catch (Exception e) {
//            System.err.println("Error deleting image: " + e.getMessage());
//            return false;
//        }
//    }
//
//    /**
//     * Delete multiple images
//     */
//    public void deleteImages(List<String> imageUrls) {
//        imageUrls.forEach(this::deleteImage);
//    }
//
//    /**
//     * Delete all images in a folder
//     */
//    public void deleteFolder(String folder, String entityId) {
//        try {
//            String prefix = String.format("%s/%s/", folder, entityId);
//            firebaseBucket.list(com.google.cloud.storage.Storage.BlobListOption.prefix(prefix))
//                    .iterateAll()
//                    .forEach(blob -> blob.delete());
//        } catch (Exception e) {
//            System.err.println("Error deleting folder: " + e.getMessage());
//        }
//    }
//
//    /**
//     * Upload bytes to Firebase and return public URL
//     */
//    private String uploadToFirebase(byte[] imageBytes, String path, String contentType) throws IOException {
//        BlobId blobId = BlobId.of(bucketName, path);
//        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
//                .setContentType(contentType)
//                .build();
//
//        firebaseBucket.getStorage().create(blobInfo, imageBytes);
//
//        // Generate signed URL (valid for 7 days)
//        Blob blob = firebaseBucket.get(path);
//        return blob.signUrl(7, TimeUnit.DAYS).toString();
//    }
//
//    /**
//     * Validate image file
//     */
//    private void validateImage(MultipartFile file) {
//        if (file.isEmpty()) {
//            throw new RuntimeException("File is empty");
//        }
//
//        if (file.getSize() > maxFileSize) {
//            throw new RuntimeException("File size exceeds maximum allowed size of " +
//                    (maxFileSize / 1024 / 1024) + "MB");
//        }
//
//        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
//        List<String> allowed = Arrays.asList(allowedFormats.split(","));
//        if (!allowed.contains(extension.toLowerCase())) {
//            throw new RuntimeException("File format not allowed. Allowed formats: " + allowedFormats);
//        }
//
//        String contentType = file.getContentType();
//        if (contentType == null || !contentType.startsWith("image/")) {
//            throw new RuntimeException("File must be an image");
//        }
//    }
//
//    /**
//     * Resize image maintaining aspect ratio
//     */
//    private BufferedImage resizeImage(BufferedImage original, int maxSize) {
//        int width = original.getWidth();
//        int height = original.getHeight();
//
//        // Don't upscale
//        if (width <= maxSize && height <= maxSize) {
//            return original;
//        }
//
//        return Scalr.resize(original, Scalr.Method.QUALITY, Scalr.Mode.FIT_TO_WIDTH,
//                maxSize, maxSize, Scalr.OP_ANTIALIAS);
//    }
//
//    /**
//     * Convert BufferedImage to byte array
//     */
//    private byte[] bufferedImageToBytes(BufferedImage image, String format) throws IOException {
//        ByteArrayOutputStream baos = new ByteArrayOutputStream();
//        ImageIO.write(image, format, baos);
//        return baos.toByteArray();
//    }
//
//    /**
//     * Generate unique filename
//     */
//    private String generateUniqueFilename(String prefix, String extension) {
//        return String.format("%s_%d.%s", prefix, System.currentTimeMillis(), extension);
//    }
//
//    /**
//     * Extract filename from Firebase Storage URL
//     */
//    private String extractFileNameFromUrl(String url) {
//        try {
//            // Firebase URLs format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg?...
//            String[] parts = url.split("/o/");
//            if (parts.length < 2) return null;
//
//            String encodedPath = parts[1].split("\\?")[0];
//            return java.net.URLDecoder.decode(encodedPath, "UTF-8");
//        } catch (Exception e) {
//            return null;
//        }
//    }
//}