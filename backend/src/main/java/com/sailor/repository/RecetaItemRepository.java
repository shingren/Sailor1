package com.sailor.repository;

import com.sailor.entity.RecetaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecetaItemRepository extends JpaRepository<RecetaItem, Long> {
}
