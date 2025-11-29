package com.sailor.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class CierreCajaResponseDTO {

    private Long id;
    private LocalDate fecha;
    private Double totalVentasDia;
    private Double totalEfectivo;
    private Double totalTarjeta;
    private Integer cantidadFacturas;
    private Double saldoEsperado;
    private Double saldoReal;
    private Double diferencia;
    private String usuarioEmail;
    private LocalDateTime timestampCreado;

    public CierreCajaResponseDTO() {
    }

    public CierreCajaResponseDTO(Long id, LocalDate fecha, Double totalVentasDia, Double totalEfectivo,
                                  Double totalTarjeta, Integer cantidadFacturas, Double saldoEsperado,
                                  Double saldoReal, Double diferencia, String usuarioEmail, LocalDateTime timestampCreado) {
        this.id = id;
        this.fecha = fecha;
        this.totalVentasDia = totalVentasDia;
        this.totalEfectivo = totalEfectivo;
        this.totalTarjeta = totalTarjeta;
        this.cantidadFacturas = cantidadFacturas;
        this.saldoEsperado = saldoEsperado;
        this.saldoReal = saldoReal;
        this.diferencia = diferencia;
        this.usuarioEmail = usuarioEmail;
        this.timestampCreado = timestampCreado;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Double getSaldoReal() {
        return saldoReal;
    }

    public void setSaldoReal(Double saldoReal) {
        this.saldoReal = saldoReal;
    }

    public Double getDiferencia() {
        return diferencia;
    }

    public void setDiferencia(Double diferencia) {
        this.diferencia = diferencia;
    }

    public String getUsuarioEmail() {
        return usuarioEmail;
    }

    public void setUsuarioEmail(String usuarioEmail) {
        this.usuarioEmail = usuarioEmail;
    }

    public LocalDateTime getTimestampCreado() {
        return timestampCreado;
    }

    public void setTimestampCreado(LocalDateTime timestampCreado) {
        this.timestampCreado = timestampCreado;
    }
}
