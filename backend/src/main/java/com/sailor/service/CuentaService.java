package com.sailor.service;

import com.sailor.dto.CuentaResponseDTO;
import com.sailor.dto.PedidoItemExtraResponseDTO;
import com.sailor.dto.PedidoItemResponseDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.entity.*;
import com.sailor.repository.CuentaRepository;
import com.sailor.repository.MesaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CuentaService {

    @Autowired
    private CuentaRepository cuentaRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Transactional
    public Cuenta findOrCreateOpenCuenta(Mesa mesa, Usuario usuario) {
        Optional<Cuenta> existingCuenta = cuentaRepository.findByMesaAndEstado(mesa, CuentaEstado.ABIERTA);

        if (existingCuenta.isPresent()) {
            return existingCuenta.get();
        }

        Cuenta newCuenta = new Cuenta();
        newCuenta.setMesa(mesa);
        newCuenta.setEstado(CuentaEstado.ABIERTA);
        newCuenta.setFechaHoraApertura(LocalDateTime.now());
        newCuenta.setCreadaPorUsuario(usuario);

        return cuentaRepository.save(newCuenta);
    }

    public List<CuentaResponseDTO> getCuentasAbiertas() {
        return cuentaRepository.findByEstado(CuentaEstado.ABIERTA).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<CuentaResponseDTO> getCuentasListasParaFacturar() {
        return cuentaRepository.findCuentasListasParaFacturar().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public Optional<CuentaResponseDTO> getCuentaById(Long id) {
        return cuentaRepository.findById(id)
                .map(this::mapToResponseDTO);
    }

    public String generarTicketCuenta(Long cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        StringBuilder ticket = new StringBuilder();

        ticket.append("====== CUENTA / FACTURA ======\n");
        ticket.append("Cuenta #").append(cuenta.getId()).append("\n");
        ticket.append("Mesa: ").append(cuenta.getMesa().getCodigo()).append("\n");
        ticket.append("Estado: ").append(cuenta.getEstado().name()).append("\n");

        if (cuenta.getFechaHoraApertura() != null) {
            ticket.append("Apertura: ").append(cuenta.getFechaHoraApertura()).append("\n");
        }

        ticket.append("------------------------------\n");

        double total = 0.0;

        for (Pedido pedido : cuenta.getPedidos()) {
            if ("CANCELADO".equalsIgnoreCase(pedido.getEstado())) {
                continue;
            }

            ticket.append("Pedido #").append(pedido.getId())
                    .append(" - ").append(pedido.getEstado())
                    .append("\n");

            for (PedidoItem item : pedido.getItems()) {
                double itemTotal = item.getCantidad() * item.getPrecioUnitario();

                ticket.append(item.getCantidad())
                        .append("x ")
                        .append(item.getProducto().getNombre())
                        .append("  $")
                        .append(String.format("%.2f", itemTotal))
                        .append("\n");

                total += itemTotal;

                if (item.getExtras() != null && !item.getExtras().isEmpty()) {
                    for (PedidoItemExtra extra : item.getExtras()) {
                        double extraTotal = extra.getCantidad() * extra.getPrecioUnitario() * item.getCantidad();

                        ticket.append("   + ")
                                .append(extra.getRecetaExtra().getNombre())
                                .append(" x")
                                .append(extra.getCantidad())
                                .append("  $")
                                .append(String.format("%.2f", extraTotal))
                                .append("\n");

                        total += extraTotal;
                    }
                }
            }

            ticket.append("------------------------------\n");
        }

        ticket.append("TOTAL: $").append(String.format("%.2f", total)).append("\n");
        ticket.append("==============================\n");

        return ticket.toString();
    }

    @Transactional
    public CuentaResponseDTO pagarCuenta(Long cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        for (Pedido pedido : cuenta.getPedidos()) {
            if (!"CANCELADO".equalsIgnoreCase(pedido.getEstado())) {
                pedido.setEstado("FACTURADO");

                if (pedido.getItems() != null) {
                    for (PedidoItem item : pedido.getItems()) {
                        if (!"CANCELADO".equalsIgnoreCase(item.getEstado())) {
                            item.setEstado("ENTREGADO");
                        }
                    }
                }
            }
        }

        cuenta.setEstado(CuentaEstado.CERRADA);
        cuenta.setFechaHoraCierre(LocalDateTime.now());

        Mesa mesa = cuenta.getMesa();
        mesa.setEstado("disponible");
        mesaRepository.save(mesa);

        Cuenta savedCuenta = cuentaRepository.save(cuenta);
        return mapToResponseDTO(savedCuenta);
    }

    @Transactional
    public void closeCuenta(Long cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        cuenta.setEstado(CuentaEstado.CERRADA);
        cuenta.setFechaHoraCierre(LocalDateTime.now());
        cuentaRepository.save(cuenta);
    }

    @Transactional
    public void markCuentaConFactura(Long cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        cuenta.setEstado(CuentaEstado.CON_FACTURA);
        cuentaRepository.save(cuenta);
    }

    private CuentaResponseDTO mapToResponseDTO(Cuenta cuenta) {
        CuentaResponseDTO dto = new CuentaResponseDTO();

        dto.setId(cuenta.getId());
        dto.setMesaId(cuenta.getMesa().getId());
        dto.setMesaCodigo(cuenta.getMesa().getCodigo());
        dto.setEstado(cuenta.getEstado().name());
        dto.setFechaHoraApertura(cuenta.getFechaHoraApertura());
        dto.setFechaHoraCierre(cuenta.getFechaHoraCierre());

        if (cuenta.getCreadaPorUsuario() != null) {
            dto.setCreadaPorUsuarioEmail(cuenta.getCreadaPorUsuario().getEmail());
        }

        List<Pedido> pedidos = cuenta.getPedidos();
        dto.setTotalPedidos(pedidos.size());

        long entregados = pedidos.stream()
                .filter(p -> "ENTREGADO".equalsIgnoreCase(p.getEstado())
                        || "FACTURADO".equalsIgnoreCase(p.getEstado())
                        || "PAGADO".equalsIgnoreCase(p.getEstado()))
                .count();
        dto.setPedidosEntregados((int) entregados);

        long pendientes = pedidos.stream()
                .filter(p -> "PENDIENTE".equalsIgnoreCase(p.getEstado())
                        || "PREPARACION".equalsIgnoreCase(p.getEstado())
                        || "LISTO".equalsIgnoreCase(p.getEstado()))
                .count();
        dto.setPedidosPendientes((int) pendientes);

        double total = pedidos.stream()
                .filter(p -> !"CANCELADO".equalsIgnoreCase(p.getEstado()))
                .mapToDouble(this::calculatePedidoTotal)
                .sum();
        dto.setTotalEstimado(total);

        List<PedidoResponseDTO> pedidoDTOs = pedidos.stream()
                .map(this::mapPedidoToResponseDTO)
                .collect(Collectors.toList());
        dto.setPedidos(pedidoDTOs);

        return dto;
    }

    private double calculatePedidoTotal(Pedido pedido) {
        return pedido.getItems().stream()
                .mapToDouble(item -> {
                    double itemTotal = item.getCantidad() * item.getPrecioUnitario();

                    double extrasTotal = item.getExtras().stream()
                            .mapToDouble(extra -> extra.getCantidad() * extra.getPrecioUnitario() * item.getCantidad())
                            .sum();

                    return itemTotal + extrasTotal;
                })
                .sum();
    }

    private PedidoResponseDTO mapPedidoToResponseDTO(Pedido pedido) {
        PedidoResponseDTO dto = new PedidoResponseDTO();

        dto.setId(pedido.getId());
        dto.setMesaId(pedido.getMesa().getId());
        dto.setMesaCodigo(pedido.getMesa().getCodigo());
        dto.setFechaHora(pedido.getFechaHora());
        dto.setEstado(pedido.getEstado());
        dto.setObservaciones(pedido.getObservaciones());
        dto.setParaLlevar(pedido.getParaLlevar());

        List<PedidoItemResponseDTO> items = pedido.getItems().stream()
                .map(this::mapItemToResponseDTO)
                .collect(Collectors.toList());

        dto.setItems(items);

        return dto;
    }

    private PedidoItemResponseDTO mapItemToResponseDTO(PedidoItem item) {
        PedidoItemResponseDTO dto = new PedidoItemResponseDTO();

        dto.setId(item.getId());
        dto.setProductoId(item.getProducto().getId());
        dto.setProductoNombre(item.getProducto().getNombre());
        dto.setCantidad(item.getCantidad());
        dto.setPrecioUnitario(item.getPrecioUnitario());

        List<PedidoItemExtraResponseDTO> extras = item.getExtras().stream()
                .map(this::mapExtraToResponseDTO)
                .collect(Collectors.toList());

        dto.setExtras(extras);

        return dto;
    }

    private PedidoItemExtraResponseDTO mapExtraToResponseDTO(PedidoItemExtra extra) {
        PedidoItemExtraResponseDTO dto = new PedidoItemExtraResponseDTO();

        dto.setId(extra.getId());
        dto.setNombre(extra.getRecetaExtra().getNombre());
        dto.setCantidad(extra.getCantidad());
        dto.setPrecioUnitario(extra.getPrecioUnitario());

        return dto;
    }
}