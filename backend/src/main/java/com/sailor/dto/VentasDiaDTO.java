package com.sailor.dto;

public class VentasDiaDTO {
    private String fecha;
    private double totalVentas;

    public VentasDiaDTO() {
    }

    public VentasDiaDTO(String fecha, double totalVentas) {
        this.fecha = fecha;
        this.totalVentas = totalVentas;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public double getTotalVentas() {
        return totalVentas;
    }

    public void setTotalVentas(double totalVentas) {
        this.totalVentas = totalVentas;
    }
}
