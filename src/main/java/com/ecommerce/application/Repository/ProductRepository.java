package com.ecommerce.application.Repository;

import com.ecommerce.application.Entity.Category;
import com.ecommerce.application.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByIsActiveTrue();
    List<Product> findByBrand(String brand);
    List<Product> findByNameContainingIgnoreCase(String name);
}
