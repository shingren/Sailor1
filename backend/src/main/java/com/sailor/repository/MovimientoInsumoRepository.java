package com.sailor.repository;

import com.sailor.entity.MovimientoInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoInsumoRepository extends JpaRepository<MovimientoInsumo, Long> {
}
