//package com.ecommerce.application.controller;
//
//import com.ecommerce.application.dto.response.ApiResponse;
//import com.ecommerce.application.dto.response.ImageUploadResponse;
//import com.ecommerce.application.service.impl.FirebaseStorageService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/images")
//@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
//public class ImageController {
//
//    private final FirebaseStorageService storageService;
//
//    /**
//     * Upload single image
//     */
//    @PostMapping("/upload")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
//            @RequestParam("file") MultipartFile file,
//            @RequestParam("folder") String folder,
//            @RequestParam("entityId") String entityId) throws IOException {
//
//        ImageUploadResponse response = storageService.uploadImage(file, folder, entityId);
//        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully", response));
//    }
//
//    /**
//     * Upload multiple images
//     */
//    @PostMapping("/upload-multiple")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<ApiResponse<List<ImageUploadResponse>>> uploadMultipleImages(
//            @RequestParam("files") List<MultipartFile> files,
//            @RequestParam("folder") String folder,
//            @RequestParam("entityId") String entityId) throws IOException {
//
//        List<ImageUploadResponse> responses = storageService.uploadImages(files, folder, entityId);
//        return ResponseEntity.ok(ApiResponse.success("Images uploaded successfully", responses));
//    }
//
//    /**
//     * Delete single image
//     */
//    @DeleteMapping
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<ApiResponse<Void>> deleteImage(@RequestParam("imageUrl") String imageUrl) {
//        boolean deleted = storageService.deleteImage(imageUrl);
//        if (deleted) {
//            return ResponseEntity.ok(ApiResponse.success("Image deleted successfully", null));
//        }
//        return ResponseEntity.ok(ApiResponse.error("Failed to delete image"));
//    }
//
//    /**
//     * Delete all images for an entity
//     */
//    @DeleteMapping("/folder")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<ApiResponse<Void>> deleteFolder(
//            @RequestParam("folder") String folder,
//            @RequestParam("entityId") String entityId) {
//
//        storageService.deleteFolder(folder, entityId);
//        return ResponseEntity.ok(ApiResponse.success("Folder deleted successfully", null));
//    }
//}