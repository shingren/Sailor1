package com.sailor.dto;

public class PedidosEstadoDTO {
    private String estado;
    private int cantidad;

    public PedidosEstadoDTO() {
    }

    public PedidosEstadoDTO(String estado, int cantidad) {
        this.estado = estado;
        this.cantidad = cantidad;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
