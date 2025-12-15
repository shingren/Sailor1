package com.sailor.repository;

import com.sailor.entity.Factura;
import com.sailor.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    Optional<Factura> findByPedido(Pedido pedido);
    boolean existsByPedido(Pedido pedido);
}
