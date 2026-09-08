package com.ecommerce.application.repository;

import com.ecommerce.application.entity.PageConfig;
import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.enums.PageKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PageConfigRepository extends JpaRepository<PageConfig, Long> {
    Optional<PageConfig> findFirstByPageKeyAndStatusOrderByIdDesc(PageKey pageKey, PageConfigStatus status);
    List<PageConfig> findByPageKeyAndStatus(PageKey pageKey, PageConfigStatus status);
    List<PageConfig> findByPageKey(PageKey pageKey);
}
