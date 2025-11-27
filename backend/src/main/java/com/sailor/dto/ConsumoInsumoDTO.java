package com.sailor.dto;

public class ConsumoInsumoDTO {
    private Long insumoId;
    private String insumoNombre;
    private double cantidadConsumida;
    private String unidad;

    public ConsumoInsumoDTO() {
    }

    public ConsumoInsumoDTO(Long insumoId, String insumoNombre, double cantidadConsumida, String unidad) {
        this.insumoId = insumoId;
        this.insumoNombre = insumoNombre;
        this.cantidadConsumida = cantidadConsumida;
        this.unidad = unidad;
    }

    public Long getInsumoId() {
        return insumoId;
    }

    public void setInsumoId(Long insumoId) {
        this.insumoId = insumoId;
    }

    public String getInsumoNombre() {
        return insumoNombre;
    }

    public void setInsumoNombre(String insumoNombre) {
        this.insumoNombre = insumoNombre;
    }

    public double getCantidadConsumida() {
        return cantidadConsumida;
    }

    public void setCantidadConsumida(double cantidadConsumida) {
        this.cantidadConsumida = cantidadConsumida;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }
}
