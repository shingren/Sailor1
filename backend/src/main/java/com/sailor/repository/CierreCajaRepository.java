package com.sailor.repository;

import com.sailor.entity.CierreCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CierreCajaRepository extends JpaRepository<CierreCaja, Long> {

    Optional<CierreCaja> findByFecha(LocalDate fecha);

    List<CierreCaja> findAllByOrderByFechaDesc();
}
