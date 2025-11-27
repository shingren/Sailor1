package com.sailor.service;

import com.sailor.dto.PedidoCreateRequestDTO;
import com.sailor.dto.PedidoItemRequestDTO;
import com.sailor.dto.PedidoItemResponseDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.entity.*;
import com.sailor.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private RecetaRepository recetaRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private MovimientoInsumoRepository movimientoInsumoRepository;

    @Transactional
    public PedidoResponseDTO createPedido(PedidoCreateRequestDTO request) {
        Mesa mesa = mesaRepository.findById(request.getMesaId())
                .orElseThrow(() -> new RuntimeException("Mesa not found with id: " + request.getMesaId()));

        Pedido pedido = new Pedido();
        pedido.setMesa(mesa);
        pedido.setObservaciones(request.getObservaciones());

        for (PedidoItemRequestDTO itemRequest : request.getItems()) {
            Producto producto = productoRepository.findById(itemRequest.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto not found with id: " + itemRequest.getProductoId()));

            PedidoItem item = new PedidoItem();
            item.setPedido(pedido);
            item.setProducto(producto);
            item.setCantidad(itemRequest.getCantidad());
            item.setPrecioUnitario(producto.getPrecio());

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
                .filter(pedido -> !pedido.getEstado().equals("ENTREGADO"))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PedidoResponseDTO cambiarEstado(Long pedidoId, String nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido not found with id: " + pedidoId));

        if (!PedidoEstado.isValid(nuevoEstado)) {
            throw new RuntimeException("Invalid estado: " + nuevoEstado);
        }

        if (!PedidoEstado.isValidTransition(pedido.getEstado(), nuevoEstado)) {
            throw new RuntimeException("Invalid transition from " + pedido.getEstado() + " to " + nuevoEstado);
        }

        if (nuevoEstado.equals("ENTREGADO")) {
            deductInventory(pedido);
        }

        pedido.setEstado(nuevoEstado);
        Pedido savedPedido = pedidoRepository.save(pedido);
        return mapToResponseDTO(savedPedido);
    }

    private void deductInventory(Pedido pedido) {
        for (PedidoItem pedidoItem : pedido.getItems()) {
            Optional<Receta> recetaOpt = recetaRepository.findByProductoId(pedidoItem.getProducto().getId());

            if (recetaOpt.isEmpty()) {
                continue;
            }

            Receta receta = recetaOpt.get();

            for (RecetaItem recetaItem : receta.getItems()) {
                double cantidadADeducir = recetaItem.getCantidadNecesaria() * pedidoItem.getCantidad();
                Insumo insumo = recetaItem.getInsumo();

                if (insumo.getStockActual() < cantidadADeducir) {
                    throw new RuntimeException("Stock insuficiente para insumo: " + insumo.getNombre() +
                            ". Disponible: " + insumo.getStockActual() + ", Necesario: " + cantidadADeducir);
                }

                insumo.setStockActual(insumo.getStockActual() - cantidadADeducir);

                MovimientoInsumo movimiento = new MovimientoInsumo();
                movimiento.setInsumo(insumo);
                movimiento.setCantidad(-cantidadADeducir);
                movimiento.setTipo("CONSUMO");
                movimiento.setDescripcion("Consumo por pedido #" + pedido.getId() + " - " +
                        pedidoItem.getProducto().getNombre() + " x" + pedidoItem.getCantidad());

                movimientoInsumoRepository.save(movimiento);
                insumoRepository.save(insumo);
            }
        }
    }

    private PedidoResponseDTO mapToResponseDTO(Pedido pedido) {
        PedidoResponseDTO dto = new PedidoResponseDTO();
        dto.setId(pedido.getId());
        dto.setMesaId(pedido.getMesa().getId());
        dto.setMesaCodigo(pedido.getMesa().getCodigo());
        dto.setFechaHora(pedido.getFechaHora());
        dto.setEstado(pedido.getEstado());
        dto.setObservaciones(pedido.getObservaciones());

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
        return dto;
    }
}
