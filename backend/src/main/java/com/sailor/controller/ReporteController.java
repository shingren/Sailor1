package com.sailor.controller;

import com.sailor.dto.*;
import com.sailor.entity.*;
import com.sailor.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reportes")
public class ReporteController {

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private MovimientoInsumoRepository movimientoInsumoRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @GetMapping("/ventas-dia")
    public VentasDiaDTO getVentasDia() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        List<Factura> facturas = facturaRepository.findAll();

        double totalVentas = facturas.stream()
                .filter(f -> f.getEstado().equals("PAGADA"))
                .filter(f -> f.getFechaHora().isAfter(startOfDay) && f.getFechaHora().isBefore(endOfDay))
                .mapToDouble(Factura::getTotal)
                .sum();

        return new VentasDiaDTO(today.toString(), totalVentas);
    }

    @GetMapping("/ventas-producto")
    public List<VentaProductoDTO> getVentasProducto() {
        List<Factura> facturasPagadas = facturaRepository.findAll().stream()
                .filter(f -> f.getEstado().equals("PAGADA"))
                .collect(Collectors.toList());

        Map<Long, VentaProductoDTO> ventasMap = new HashMap<>();

        for (Factura factura : facturasPagadas) {
            Pedido pedido = factura.getPedido();
            for (PedidoItem item : pedido.getItems()) {
                Long productoId = item.getProducto().getId();
                String productoNombre = item.getProducto().getNombre();
                int cantidad = item.getCantidad();

                if (ventasMap.containsKey(productoId)) {
                    VentaProductoDTO dto = ventasMap.get(productoId);
                    dto.setCantidadVendida(dto.getCantidadVendida() + cantidad);
                } else {
                    ventasMap.put(productoId, new VentaProductoDTO(productoId, productoNombre, cantidad));
                }
            }
        }

        return new ArrayList<>(ventasMap.values());
    }

    @GetMapping("/pedidos-estado")
    public List<PedidosEstadoDTO> getPedidosEstado() {
        List<Pedido> pedidos = pedidoRepository.findAll();

        Map<String, Integer> estadoCounts = new HashMap<>();
        estadoCounts.put("PENDIENTE", 0);
        estadoCounts.put("PREPARACION", 0);
        estadoCounts.put("LISTO", 0);
        estadoCounts.put("ENTREGADO", 0);

        for (Pedido pedido : pedidos) {
            String estado = pedido.getEstado();
            estadoCounts.put(estado, estadoCounts.getOrDefault(estado, 0) + 1);
        }

        List<PedidosEstadoDTO> result = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : estadoCounts.entrySet()) {
            result.add(new PedidosEstadoDTO(entry.getKey(), entry.getValue()));
        }

        return result;
    }

    @GetMapping("/consumo-insumos-dia")
    public List<ConsumoInsumoDTO> getConsumoInsumosDia() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        List<MovimientoInsumo> movimientos = movimientoInsumoRepository.findAll().stream()
                .filter(m -> m.getTipo().equals("CONSUMO"))
                .filter(m -> m.getFechaHora().isAfter(startOfDay) && m.getFechaHora().isBefore(endOfDay))
                .collect(Collectors.toList());

        Map<Long, ConsumoInsumoDTO> consumoMap = new HashMap<>();

        for (MovimientoInsumo movimiento : movimientos) {
            Long insumoId = movimiento.getInsumo().getId();
            String insumoNombre = movimiento.getInsumo().getNombre();
            String unidad = movimiento.getInsumo().getUnidad();
            double cantidad = movimiento.getCantidad();

            if (consumoMap.containsKey(insumoId)) {
                ConsumoInsumoDTO dto = consumoMap.get(insumoId);
                dto.setCantidadConsumida(dto.getCantidadConsumida() + cantidad);
            } else {
                consumoMap.put(insumoId, new ConsumoInsumoDTO(insumoId, insumoNombre, cantidad, unidad));
            }
        }

        return new ArrayList<>(consumoMap.values());
    }

    @GetMapping("/reservas-dia")
    public List<ReservaDiaDTO> getReservasDia() {
        LocalDate today = LocalDate.now();

        List<Reserva> reservas = reservaRepository.findAll().stream()
                .filter(r -> r.getFecha().equals(today))
                .collect(Collectors.toList());

        List<ReservaDiaDTO> result = new ArrayList<>();
        for (Reserva reserva : reservas) {
            result.add(new ReservaDiaDTO(
                    reserva.getId(),
                    reserva.getMesa().getId(),
                    reserva.getClienteNombre(),
                    reserva.getHoraInicio().toString(),
                    reserva.getHoraFin().toString(),
                    reserva.getEstado()
            ));
        }

        return result;
    }
}
