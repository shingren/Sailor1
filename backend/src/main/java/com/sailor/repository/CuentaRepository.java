package com.sailor.repository;

import com.sailor.entity.Cuenta;
import com.sailor.entity.CuentaEstado;
import com.sailor.entity.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuentaRepository extends JpaRepository<Cuenta, Long> {

    Optional<Cuenta> findByMesaAndEstado(Mesa mesa, CuentaEstado estado);

    List<Cuenta> findByEstado(CuentaEstado estado);

    @Query("SELECT c FROM Cuenta c WHERE c.estado = 'ABIERTA' AND c.factura IS NULL " +
            "AND EXISTS (SELECT p FROM Pedido p WHERE p.cuenta = c AND p.estado = 'ENTREGADO') " +
            "AND NOT EXISTS (SELECT p FROM Pedido p WHERE p.cuenta = c AND p.estado NOT IN ('ENTREGADO', 'FACTURADO', 'PAGADO'))")
    List<Cuenta> findCuentasListasParaFacturar();
}