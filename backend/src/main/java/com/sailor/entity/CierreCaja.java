package com.sailor.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cierre_caja")
public class CierreCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate fecha;

    @Column(nullable = false)
    private Double totalVentasDia;

    @Column(nullable = false)
    private Double totalEfectivo;

    @Column(nullable = false)
    private Double totalTarjeta;

    @Column(nullable = false)
    private Integer cantidadFacturas;

    @Column(nullable = false)
    private Double saldoEsperado;

    @Column(nullable = false)
    private Double saldoReal;

    @Column(nullable = false)
    private Double diferencia;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime timestampCreado;

    public CierreCaja() {
        this.timestampCreado = LocalDateTime.now();
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

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDateTime getTimestampCreado() {
        return timestampCreado;
    }

    public void setTimestampCreado(LocalDateTime timestampCreado) {
        this.timestampCreado = timestampCreado;
    }
}
