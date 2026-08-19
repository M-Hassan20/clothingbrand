package com.ecommerce.application.repository;

import com.ecommerce.application.entity.HomepageConfig;
import com.ecommerce.application.enums.HomepageConfigStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HomepageConfigRepository extends JpaRepository<HomepageConfig, Long> {
    Optional<HomepageConfig> findByStatus(HomepageConfigStatus status);
}
