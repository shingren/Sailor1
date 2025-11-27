package com.sailor.service;

import com.sailor.dto.RecetaItemDTO;
import com.sailor.dto.RecetaResponseDTO;
import com.sailor.entity.Insumo;
import com.sailor.entity.Producto;
import com.sailor.entity.Receta;
import com.sailor.entity.RecetaItem;
import com.sailor.repository.InsumoRepository;
import com.sailor.repository.ProductoRepository;
import com.sailor.repository.RecetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecetaService {

    @Autowired
    private RecetaRepository recetaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Transactional
    public RecetaResponseDTO createReceta(Long productoId, List<RecetaItemDTO> items) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto not found with id: " + productoId));

        Receta receta = new Receta();
        receta.setProducto(producto);

        for (RecetaItemDTO itemDTO : items) {
            Insumo insumo = insumoRepository.findById(itemDTO.getInsumoId())
                    .orElseThrow(() -> new RuntimeException("Insumo not found with id: " + itemDTO.getInsumoId()));

            RecetaItem recetaItem = new RecetaItem();
            recetaItem.setReceta(receta);
            recetaItem.setInsumo(insumo);
            recetaItem.setCantidadNecesaria(itemDTO.getCantidadNecesaria());

            receta.getItems().add(recetaItem);
        }

        Receta saved = recetaRepository.save(receta);
        return mapToResponseDTO(saved);
    }

    public List<RecetaResponseDTO> listRecetas() {
        return recetaRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public RecetaResponseDTO getRecetaByProducto(Long productoId) {
        Receta receta = recetaRepository.findByProductoId(productoId)
                .orElseThrow(() -> new RuntimeException("Receta not found for producto id: " + productoId));
        return mapToResponseDTO(receta);
    }

    private RecetaResponseDTO mapToResponseDTO(Receta receta) {
        RecetaResponseDTO dto = new RecetaResponseDTO();
        dto.setId(receta.getId());
        dto.setProductoId(receta.getProducto().getId());
        dto.setProductoNombre(receta.getProducto().getNombre());

        List<RecetaItemDTO> itemDTOs = receta.getItems().stream()
                .map(this::mapItemToDTO)
                .collect(Collectors.toList());
        dto.setItems(itemDTOs);

        return dto;
    }

    private RecetaItemDTO mapItemToDTO(RecetaItem item) {
        RecetaItemDTO dto = new RecetaItemDTO();
        dto.setInsumoId(item.getInsumo().getId());
        dto.setInsumoNombre(item.getInsumo().getNombre());
        dto.setCantidadNecesaria(item.getCantidadNecesaria());
        return dto;
    }
}
