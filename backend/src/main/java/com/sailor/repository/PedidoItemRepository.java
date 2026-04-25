package com.sailor.repository;

import com.sailor.entity.PedidoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoItemRepository extends JpaRepository<PedidoItem, Long> {

    List<PedidoItem> findByEstacionAndEstadoInOrderByIdAsc(String estacion, List<String> estados);
}
