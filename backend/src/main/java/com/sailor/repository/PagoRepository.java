package com.sailor.repository;

import com.sailor.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    @Query("SELECT COALESCE(SUM(p.monto), 0.0) FROM Pago p WHERE p.metodo = :metodo AND p.fechaHora >= :startOfDay AND p.fechaHora < :endOfDay")
    double sumByMetodoAndFechaHoraBetween(@Param("metodo") String metodo, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
