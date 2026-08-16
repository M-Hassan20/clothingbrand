package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.BlogPostRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.BlogPostAdminResponse;
import com.ecommerce.application.dto.response.ImageUploadResponse;
import com.ecommerce.application.service.impl.BlogPostService;
import com.ecommerce.application.service.impl.CloudinaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/blog")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminBlogController {

    private final BlogPostService blogPostService;
    private final CloudinaryService storageService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogPostAdminResponse>>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BlogPostAdminResponse> posts = blogPostService.getAllForAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success("All blog posts retrieved", posts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogPostAdminResponse>> getPostById(@PathVariable Long id) {
        BlogPostAdminResponse post = blogPostService.getByIdForAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Blog post retrieved", post));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BlogPostAdminResponse>> createDraft(
            @Valid @RequestBody BlogPostRequest request) {

        BlogPostAdminResponse post = blogPostService.createDraft(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Draft created", post));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogPostAdminResponse>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody BlogPostRequest request) {

        BlogPostAdminResponse post = blogPostService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Post updated", post));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<BlogPostAdminResponse>> publish(@PathVariable Long id) {
        BlogPostAdminResponse post = blogPostService.publish(id);
        return ResponseEntity.ok(ApiResponse.success("Post published", post));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<BlogPostAdminResponse>> unpublish(@PathVariable Long id) {
        BlogPostAdminResponse post = blogPostService.unpublish(id);
        return ResponseEntity.ok(ApiResponse.success("Post unpublished (now draft)", post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        blogPostService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post deleted", null));
    }

    /**
     * Upload the cover image for a post
     */
    @PostMapping("/{id}/cover-image")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadCoverImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        ImageUploadResponse response = storageService.uploadImage(file, "blog-covers", id.toString());
        return ResponseEntity.ok(ApiResponse.success("Cover image uploaded", response));
    }

    /**
     * Upload an image to embed mid-content in the rich text editor.
     * Frontend inserts the returned fileUrl into the editor at the cursor position.
     */
    @PostMapping("/{id}/content-image")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadContentImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        ImageUploadResponse response = storageService.uploadImage(file, "blog-content", id.toString());
        return ResponseEntity.ok(ApiResponse.success("Image uploaded", response));
    }
}