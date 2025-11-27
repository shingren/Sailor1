package com.sailor.service;

import com.sailor.dto.PedidoCreateRequestDTO;
import com.sailor.dto.PedidoItemRequestDTO;
import com.sailor.dto.PedidoItemResponseDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.entity.Mesa;
import com.sailor.entity.Pedido;
import com.sailor.entity.PedidoEstado;
import com.sailor.entity.PedidoItem;
import com.sailor.entity.Producto;
import com.sailor.repository.MesaRepository;
import com.sailor.repository.PedidoRepository;
import com.sailor.repository.ProductoRepository;
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
    private MesaRepository mesaRepository;

    @Autowired
    private ProductoRepository productoRepository;

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

        pedido.setEstado(nuevoEstado);
        Pedido savedPedido = pedidoRepository.save(pedido);
        return mapToResponseDTO(savedPedido);
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
