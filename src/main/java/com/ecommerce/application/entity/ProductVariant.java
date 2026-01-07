package com.ecommerce.application.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @NotBlank
    private String size;

    @NotBlank
    private String color;

    @NotNull
    private BigDecimal price;

    @Min(0)
    private Integer stockQuantity;

    @Column(nullable = false)
    private String publicImageUrl;

@ElementCollection
@CollectionTable(
        name = "product_variant_images",
        joinColumns = @JoinColumn(name = "variant_id")
)
@Column(name = "image_url")
private List<String> additionalImageUrls = new ArrayList<>();
    @Column(unique = true)
    private String sku;

    private Boolean isActive;
}
