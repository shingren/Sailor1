package com.sailor.service;

import com.sailor.dto.CocinaItemResponseDTO;
import com.sailor.dto.PedidoCreateRequestDTO;
import com.sailor.dto.PedidoItemExtraRequestDTO;
import com.sailor.dto.PedidoItemRequestDTO;
import com.sailor.dto.PedidoItemResponseDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.entity.Cuenta;
import com.sailor.entity.Mesa;
import com.sailor.entity.Pedido;
import com.sailor.entity.PedidoItem;
import com.sailor.entity.PedidoItemExtra;
import com.sailor.entity.Producto;
import com.sailor.entity.RecetaExtra;
import com.sailor.repository.MesaRepository;
import com.sailor.repository.PedidoItemRepository;
import com.sailor.repository.PedidoRepository;
import com.sailor.repository.ProductoRepository;
import com.sailor.repository.RecetaExtraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoItemRepository pedidoItemRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private RecetaExtraRepository recetaExtraRepository;

    @Autowired
    private CuentaService cuentaService;

    @Transactional
    public PedidoResponseDTO createPedido(PedidoCreateRequestDTO request) {
        Mesa mesa = mesaRepository.findById(request.getMesaId())
                .orElseThrow(() -> new RuntimeException("Mesa not found with id: " + request.getMesaId()));

        if ("disponible".equalsIgnoreCase(mesa.getEstado())) {
            mesa.setEstado("ocupada");
            mesaRepository.save(mesa);
        }

        Cuenta cuenta = cuentaService.findOrCreateOpenCuenta(mesa, null);

        Pedido pedido = new Pedido();
        pedido.setMesa(mesa);
        pedido.setCuenta(cuenta);
        pedido.setObservaciones(request.getObservaciones());
        pedido.setEstado("PENDIENTE");

        for (PedidoItemRequestDTO itemRequest : request.getItems()) {
            Producto producto = productoRepository.findById(itemRequest.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto not found with id: " + itemRequest.getProductoId()));

            PedidoItem item = new PedidoItem();
            item.setPedido(pedido);
            item.setProducto(producto);
            item.setCantidad(itemRequest.getCantidad());
            item.setPrecioUnitario(producto.getPrecio());
            item.setEstacion(producto.getEstacion() == null ? "HOT" : producto.getEstacion());
            item.setEstado("PENDIENTE");

            if (itemRequest.getExtras() != null && !itemRequest.getExtras().isEmpty()) {
                for (PedidoItemExtraRequestDTO extraRequest : itemRequest.getExtras()) {
                    RecetaExtra recetaExtra = recetaExtraRepository.findById(extraRequest.getRecetaExtraId())
                            .orElseThrow(() -> new RuntimeException(
                                    "RecetaExtra not found with id: " + extraRequest.getRecetaExtraId()
                            ));

                    PedidoItemExtra pedidoItemExtra = new PedidoItemExtra();
                    pedidoItemExtra.setPedidoItem(item);
                    pedidoItemExtra.setRecetaExtra(recetaExtra);
                    pedidoItemExtra.setCantidad(extraRequest.getCantidad());
                    pedidoItemExtra.setPrecioUnitario(recetaExtra.getPrecio());

                    item.getExtras().add(pedidoItemExtra);
                }
            }

            pedido.getItems().add(item);
        }

        Pedido savedPedido = pedidoRepository.save(pedido);
        return mapToResponseDTO(savedPedido);
    }

    public List<PedidoResponseDTO> getAllPedidos() {
        return pedidoRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public PedidoResponseDTO getPedidoById(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido not found with id: " + id));

        return mapToResponseDTO(pedido);
    }

    public List<PedidoResponseDTO> getActivePedidos() {
        return pedidoRepository.findAll().stream()
                .filter(pedido -> {
                    String estado = pedido.getEstado();

                    return estado == null
                            || (!estado.equalsIgnoreCase("FACTURADO")
                            && !estado.equalsIgnoreCase("CANCELADO")
                            && !estado.equalsIgnoreCase("ENTREGADO"));
                })
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PedidoResponseDTO> getPedidosListosParaFacturar() {
        return pedidoRepository.findAll().stream()
                .filter(pedido -> "LISTO".equalsIgnoreCase(pedido.getEstado()))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public boolean mesaListaParaFacturar(Long mesaId) {
        List<Pedido> pedidos = pedidoRepository.findAll().stream()
                .filter(p -> p.getMesa() != null && p.getMesa().getId().equals(mesaId))
                .filter(p -> p.getEstado() == null
                        || (!p.getEstado().equalsIgnoreCase("FACTURADO")
                        && !p.getEstado().equalsIgnoreCase("CANCELADO")))
                .collect(Collectors.toList());

        if (pedidos.isEmpty()) {
            return false;
        }

        return pedidos.stream()
                .flatMap(p -> p.getItems().stream())
                .allMatch(item -> "ENTREGADO".equalsIgnoreCase(item.getEstado()));
    }

    @Transactional
    public PedidoResponseDTO cambiarEstado(Long pedidoId, String nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido not found with id: " + pedidoId));

        pedido.setEstado(nuevoEstado);

        Pedido savedPedido = pedidoRepository.save(pedido);
        return mapToResponseDTO(savedPedido);
    }

    public List<CocinaItemResponseDTO> getItemsCocinaPorEstacion(String estacion) {
        return pedidoItemRepository.findAll().stream()
                .filter(item -> item.getEstacion() != null && item.getEstacion().equalsIgnoreCase(estacion))
                .filter(item -> item.getEstado() != null && (
                        item.getEstado().equalsIgnoreCase("PENDIENTE")
                                || item.getEstado().equalsIgnoreCase("PREPARACION")
                                || item.getEstado().equalsIgnoreCase("LISTO")
                ))
                .map(this::mapToCocinaItemDTO)
                .collect(Collectors.toList());
    }

    public List<CocinaItemResponseDTO> getItemsListosParaServir() {
        return pedidoItemRepository.findAll().stream()
                .filter(item -> item.getEstado() != null && item.getEstado().equalsIgnoreCase("LISTO"))
                .map(this::mapToCocinaItemDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CocinaItemResponseDTO cambiarEstadoItem(Long itemId, String nuevoEstado) {
        PedidoItem item = pedidoItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("PedidoItem not found with id: " + itemId));

        item.setEstado(nuevoEstado);

        PedidoItem savedItem = pedidoItemRepository.save(item);

        actualizarEstadoPedidoDesdeItems(savedItem.getPedido());

        return mapToCocinaItemDTO(savedItem);
    }

    private void actualizarEstadoPedidoDesdeItems(Pedido pedido) {
        if (pedido == null || pedido.getItems() == null || pedido.getItems().isEmpty()) {
            return;
        }

        boolean allEntregado = pedido.getItems().stream()
                .allMatch(i -> "ENTREGADO".equalsIgnoreCase(i.getEstado()));

        boolean allListoOrEntregado = pedido.getItems().stream()
                .allMatch(i ->
                        "LISTO".equalsIgnoreCase(i.getEstado())
                                || "ENTREGADO".equalsIgnoreCase(i.getEstado())
                );

        boolean anyPreparacion = pedido.getItems().stream()
                .anyMatch(i -> "PREPARACION".equalsIgnoreCase(i.getEstado()));

        boolean anyPendiente = pedido.getItems().stream()
                .anyMatch(i -> "PENDIENTE".equalsIgnoreCase(i.getEstado()));

        if (allEntregado) {
            pedido.setEstado("ENTREGADO");
        } else if (allListoOrEntregado) {
            pedido.setEstado("LISTO");
        } else if (anyPreparacion) {
            pedido.setEstado("PREPARACION");
        } else if (anyPendiente) {
            pedido.setEstado("PENDIENTE");
        }

        pedidoRepository.save(pedido);
    }

    private CocinaItemResponseDTO mapToCocinaItemDTO(PedidoItem item) {
        CocinaItemResponseDTO dto = new CocinaItemResponseDTO();

        dto.setItemId(item.getId());
        dto.setPedidoId(item.getPedido().getId());
        dto.setMesaCodigo(item.getPedido().getMesa().getCodigo());
        dto.setProductoNombre(item.getProducto().getNombre());
        dto.setCantidad(item.getCantidad());
        dto.setObservaciones(item.getPedido().getObservaciones());
        dto.setEstacion(item.getEstacion());
        dto.setEstado(item.getEstado());

        return dto;
    }

    private PedidoResponseDTO mapToResponseDTO(Pedido pedido) {
        PedidoResponseDTO dto = new PedidoResponseDTO();

        dto.setId(pedido.getId());
        dto.setMesaId(pedido.getMesa().getId());
        dto.setMesaCodigo(pedido.getMesa().getCodigo());
        dto.setObservaciones(pedido.getObservaciones());
        dto.setEstado(pedido.getEstado());

        if (pedido.getFechaHora() != null) {
            dto.setFechaHora(pedido.getFechaHora());
        }

        List<PedidoItemResponseDTO> items = pedido.getItems().stream()
                .map(item -> {
                    PedidoItemResponseDTO itemDTO = new PedidoItemResponseDTO();

                    itemDTO.setId(item.getId());
                    itemDTO.setProductoId(item.getProducto().getId());
                    itemDTO.setProductoNombre(item.getProducto().getNombre());
                    itemDTO.setCantidad(item.getCantidad());
                    itemDTO.setPrecioUnitario(item.getPrecioUnitario());

                    return itemDTO;
                })
                .collect(Collectors.toList());

        dto.setItems(items);

        return dto;
    }
}