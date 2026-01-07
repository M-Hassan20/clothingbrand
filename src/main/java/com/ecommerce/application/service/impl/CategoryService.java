package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Category;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categoryRepository;

    @Cacheable(value = "categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
    }

    public Category getCategoryByName(String name) {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Category","name",name));
    }

    @Cacheable(value = "categoriesWithProducts")
    public List<Category> getCategoriesWithActiveProducts() {
        return categoryRepository.findCategoriesWithActiveProducts();
    }

    @Transactional
    @CacheEvict(value = {"categories", "categoriesWithProducts"}, allEntries = true)
    public Category createCategory(Category category) {
        if(categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("Category with name: " + category.getName() + " already exists");
        }
        if(category.getName().isBlank()) {
            throw new RuntimeException("Category name cannot be null");
        }
        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = {"categories", "categoriesWithProducts"}, allEntries = true)
    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = getCategoryById(id);
        category.setName(categoryDetails.getName());
        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = {"categories", "categoriesWithProducts"}, allEntries = true)
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
