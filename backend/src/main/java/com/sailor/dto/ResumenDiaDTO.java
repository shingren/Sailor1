package com.sailor.dto;

import java.time.LocalDate;

public class ResumenDiaDTO {

    private LocalDate fecha;
    private Double totalVentasDia;
    private Double totalEfectivo;
    private Double totalTarjeta;
    private Integer cantidadFacturas;
    private Double saldoEsperado;
    private boolean cierreExiste;

    public ResumenDiaDTO() {
    }

    public ResumenDiaDTO(LocalDate fecha, Double totalVentasDia, Double totalEfectivo, Double totalTarjeta,
                          Integer cantidadFacturas, Double saldoEsperado, boolean cierreExiste) {
        this.fecha = fecha;
        this.totalVentasDia = totalVentasDia;
        this.totalEfectivo = totalEfectivo;
        this.totalTarjeta = totalTarjeta;
        this.cantidadFacturas = cantidadFacturas;
        this.saldoEsperado = saldoEsperado;
        this.cierreExiste = cierreExiste;
    }

    // Getters and Setters

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Double getTotalVentasDia() {
        return totalVentasDia;
    }

    public void setTotalVentasDia(Double totalVentasDia) {
        this.totalVentasDia = totalVentasDia;
    }

    public Double getTotalEfectivo() {
        return totalEfectivo;
    }

    public void setTotalEfectivo(Double totalEfectivo) {
        this.totalEfectivo = totalEfectivo;
    }

    public Double getTotalTarjeta() {
        return totalTarjeta;
    }

    public void setTotalTarjeta(Double totalTarjeta) {
        this.totalTarjeta = totalTarjeta;
    }

    public Integer getCantidadFacturas() {
        return cantidadFacturas;
    }

    public void setCantidadFacturas(Integer cantidadFacturas) {
        this.cantidadFacturas = cantidadFacturas;
    }

    public Double getSaldoEsperado() {
        return saldoEsperado;
    }

    public void setSaldoEsperado(Double saldoEsperado) {
        this.saldoEsperado = saldoEsperado;
    }

    public boolean isCierreExiste() {
        return cierreExiste;
    }

    public void setCierreExiste(boolean cierreExiste) {
        this.cierreExiste = cierreExiste;
    }
}
