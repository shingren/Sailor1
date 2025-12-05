package com.sailor.dto;

public class PedidoItemExtraRequestDTO {
    private Long recetaExtraId;
    private int cantidad;

    public PedidoItemExtraRequestDTO() {
    }

    public Long getRecetaExtraId() {
        return recetaExtraId;
    }

    public void setRecetaExtraId(Long recetaExtraId) {
        this.recetaExtraId = recetaExtraId;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
