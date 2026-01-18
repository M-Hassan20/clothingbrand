package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.CategoryRequest;
import com.ecommerce.application.dto.response.CategoryResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.CategoryMapper;
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
    private final CategoryMapper categoryMapper;

    @Cacheable(value = "categories")
    public List<CategoryResponse> getAllCategories() {
        return categoryMapper.toResponseList(categoryRepository.findAll());
    }

    public CategoryResponse getCategoryById(Long id) {
         Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
         return categoryMapper.toResponse(category);
    }

    private Category getCategoryEntityById(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category", "ID", id));
    }

    public CategoryResponse getCategoryByName(String name) {
        Category category = categoryRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Category","name",name));
        return categoryMapper.toResponse(category);
    }

    @Cacheable(value = "categoriesWithProducts")
    public List<CategoryResponse> getCategoriesWithActiveProducts() {
        return categoryMapper.toResponseList(categoryRepository.findCategoriesWithActiveProducts());
    }

    @Transactional
    @CacheEvict(value = {"categories", "categoriesWithProducts"}, allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        if(categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category with name: " + request.getName() + " already exists");
        }
        if(request.getName().isBlank()) {
            throw new RuntimeException("Category name cannot be null");
        }
        Category newCategory = categoryMapper.toEntity(request);
        return categoryMapper.toResponse(newCategory);
    }

    @Transactional
    @CacheEvict(value = {"categories", "categoriesWithProducts"}, allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = getCategoryEntityById(id);
        category.setName(request.getName());
        Category updatedCategory = categoryRepository.save(category);
        return categoryMapper.toResponse(updatedCategory);
    }

    @Transactional
    @CacheEvict(value = {"categories", "categoriesWithProducts"}, allEntries = true)
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
