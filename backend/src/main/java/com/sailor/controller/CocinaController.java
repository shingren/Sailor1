package com.sailor.controller;

import com.sailor.dto.CocinaItemResponseDTO;
import com.sailor.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cocina")
public class CocinaController {

    @Autowired
    private PedidoService pedidoService;

    @GetMapping("/pedidos/{pedidoId}/ticket")
    public String getTicketCocina(@PathVariable Long pedidoId) {
        return pedidoService.generarTicketCocina(pedidoId);
    }

    @GetMapping("/pedidos/{pedidoId}/tickets")
    public List<String> getTicketsPorEstacion(@PathVariable Long pedidoId) {
        return pedidoService.generarTicketsPorEstacion(pedidoId);
    }

    @GetMapping("/pedidos/{pedidoId}/ticket-cliente")
    public String getTicketCliente(@PathVariable Long pedidoId) {
        return pedidoService.generarTicketCliente(pedidoId);
    }

    @GetMapping("/items")
    public List<CocinaItemResponseDTO> getItemsPorEstacion(@RequestParam String estacion) {
        return pedidoService.getItemsCocinaPorEstacion(estacion);
    }

    @GetMapping("/items/listos")
    public List<CocinaItemResponseDTO> getItemsListos() {
        return pedidoService.getItemsListosParaServir();
    }

    @PostMapping("/items/{itemId}/iniciar")
    public CocinaItemResponseDTO iniciarItem(@PathVariable Long itemId) {
        return pedidoService.cambiarEstadoItem(itemId, "PREPARACION");
    }

    @PostMapping("/items/{itemId}/listo")
    public CocinaItemResponseDTO marcarItemListo(@PathVariable Long itemId) {
        return pedidoService.cambiarEstadoItem(itemId, "LISTO");
    }

    @PostMapping("/items/{itemId}/entregado")
    public CocinaItemResponseDTO marcarItemEntregado(@PathVariable Long itemId) {
        return pedidoService.cambiarEstadoItem(itemId, "ENTREGADO");
    }
}