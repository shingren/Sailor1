package com.sailor.controller;

import com.sailor.dto.PedidoCreateRequestDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @PostMapping
    public PedidoResponseDTO createPedido(@RequestBody PedidoCreateRequestDTO request) {
        return pedidoService.createPedido(request);
    }

    @GetMapping
    public List<PedidoResponseDTO> getAllPedidos() {
        return pedidoService.getAllPedidos();
    }

    @GetMapping("/{id}")
    public PedidoResponseDTO getPedidoById(@PathVariable Long id) {
        return pedidoService.getPedidoById(id);
    }

    @GetMapping("/activos")
    public List<PedidoResponseDTO> getActivePedidos() {
        return pedidoService.getActivePedidos();
    }

    @GetMapping("/listos-facturar")
    public List<PedidoResponseDTO> getPedidosListosParaFacturar() {
        return pedidoService.getPedidosListosParaFacturar();
    }

    @PatchMapping("/{id}/estado")
    public PedidoResponseDTO cambiarEstado(@PathVariable Long id, @RequestBody EstadoRequest request) {
        return pedidoService.cambiarEstado(id, request.getEstado());
    }

    static class EstadoRequest {
        private String estado;

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }
    }
}
