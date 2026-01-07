package com.ecommerce.application.repository;

import com.ecommerce.application.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    boolean existsByName(String name);

    @Query("SELECT c.id, c.name, COUNT(p) FROM Category c " +
            "LEFT JOIN Product p ON p.category.id = c.id AND p.isActive = true " +
            "GROUP BY c.id, c.name " +
            "ORDER BY c.name")
    List<Object[]> findCategoriesWithProductCount();

    @Query("SELECT DISTINCT c FROM Category c " +
            "JOIN Product p ON p.category.id = c.id " +
            "WHERE p.isActive = true " +
            "ORDER BY c.name")
    List<Category> findCategoriesWithActiveProducts();
}
