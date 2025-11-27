package com.sailor.dto;

public class VentaProductoDTO {
    private Long productoId;
    private String productoNombre;
    private int cantidadVendida;

    public VentaProductoDTO() {
    }

    public VentaProductoDTO(Long productoId, String productoNombre, int cantidadVendida) {
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.cantidadVendida = cantidadVendida;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getProductoNombre() {
        return productoNombre;
    }

    public void setProductoNombre(String productoNombre) {
        this.productoNombre = productoNombre;
    }

    public int getCantidadVendida() {
        return cantidadVendida;
    }

    public void setCantidadVendida(int cantidadVendida) {
        this.cantidadVendida = cantidadVendida;
    }
}
