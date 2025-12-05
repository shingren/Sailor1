package com.sailor.dto;

import java.util.List;

public class PedidoItemRequestDTO {
    private Long productoId;
    private int cantidad;
    private List<PedidoItemExtraRequestDTO> extras;

    public PedidoItemRequestDTO() {
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public List<PedidoItemExtraRequestDTO> getExtras() {
        return extras;
    }

    public void setExtras(List<PedidoItemExtraRequestDTO> extras) {
        this.extras = extras;
    }
}
