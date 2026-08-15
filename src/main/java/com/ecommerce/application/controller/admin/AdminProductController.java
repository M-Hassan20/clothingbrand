package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.ProductCreateRequest;
import com.ecommerce.application.dto.request.ProductUpdateRequest;
import com.ecommerce.application.dto.request.ProductVariantRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.ImageUploadResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.service.impl.CloudinaryService;
import com.ecommerce.application.service.impl.ProductServiceImpl;
import com.ecommerce.application.service.impl.ProductVariantServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminProductController {

    private final ProductServiceImpl productService;
    private final ProductVariantServiceImpl productVariantService;
    private final CloudinaryService storageService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request) {

        ProductResponse product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {

        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<Product>>> getLowStockProducts() {
        List<Product> products = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success("Low stock products retrieved", products));
    }

    // Variant management
    @PostMapping("/variants")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> createVariant(
            @Valid @RequestBody ProductVariantRequest request) {

        ProductVariantResponse variant = productVariantService.createVariant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Variant created successfully", variant));
    }

    @PutMapping("/variants/{id}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateVariant(
            @PathVariable Long id,
            @Valid @RequestBody ProductVariantRequest request) {

        ProductVariantResponse variant = productVariantService.updateVariant(id, request);
        return ResponseEntity.ok(ApiResponse.success("Variant updated successfully", variant));
    }

    @DeleteMapping("/variants/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable Long id) {
        productVariantService.deleteVariant(id);
        return ResponseEntity.ok(ApiResponse.success("Variant deleted successfully", null));
    }

    @PatchMapping("/variants/{id}/stock")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        ProductVariantResponse variant = productVariantService.updateStock(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", variant));
    }

    @GetMapping("/variants/low-stock")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getLowStockVariants(
            @RequestParam(defaultValue = "10") Integer threshold) {

        List<ProductVariantResponse> variants = productVariantService.getLowStockVariants(threshold);
        return ResponseEntity.ok(ApiResponse.success("Low stock variants retrieved", variants));
    }

    /**
     * Create product with images
     */
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<ProductResponse>> createProductWithImages(
            @RequestPart("product") @Valid ProductCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) throws IOException {

        // Create product first
        ProductResponse product = productService.createProduct(request);

        // Upload images if provided
        if (images != null && !images.isEmpty()) {
            List<ImageUploadResponse> uploadedImages = storageService.uploadImages(
                    images, "products", product.getId().toString());

            // Update product with first image as thumbnail
            if (!uploadedImages.isEmpty()) {
                // You'll need to add this method to ProductService
                productService.updateProductThumbnail(product.getId(), uploadedImages.get(0).getFileUrl());
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", product));
    }


    /**
     * Upload product variant images
     */
    @PostMapping("/variants/{variantId}/images")
    public ResponseEntity<ApiResponse<List<ImageUploadResponse>>> uploadVariantImages(
            @PathVariable Long variantId,
            @RequestParam("files") List<MultipartFile> files) throws IOException {

        List<ImageUploadResponse> responses = storageService.uploadImages(
                files, "variants", variantId.toString());

        // Update variant with images
        if (!responses.isEmpty()) {
            productVariantService.updateVariantImages(
                    variantId,
                    responses.get(0).getFileUrl(),
                    responses.stream().map(ImageUploadResponse::getFileUrl).toList()
            );
        }

        return ResponseEntity.ok(ApiResponse.success("Images uploaded successfully", responses));
    }

}