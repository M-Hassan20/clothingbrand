package com.ecommerce.application.repository;

import com.ecommerce.application.entity.AnnouncementConfig;
import com.ecommerce.application.enums.PageConfigStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnnouncementConfigRepository extends JpaRepository<AnnouncementConfig, Long> {
    Optional<AnnouncementConfig> findFirstByStatusOrderByIdDesc(PageConfigStatus status);
    List<AnnouncementConfig> findByStatus(PageConfigStatus status);
}
