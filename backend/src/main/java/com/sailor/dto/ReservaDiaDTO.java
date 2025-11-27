package com.sailor.dto;

public class ReservaDiaDTO {
    private Long id;
    private Long mesaId;
    private String clienteNombre;
    private String horaInicio;
    private String horaFin;
    private String estado;

    public ReservaDiaDTO() {
    }

    public ReservaDiaDTO(Long id, Long mesaId, String clienteNombre, String horaInicio, String horaFin, String estado) {
        this.id = id;
        this.mesaId = mesaId;
        this.clienteNombre = clienteNombre;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.estado = estado;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMesaId() {
        return mesaId;
    }

    public void setMesaId(Long mesaId) {
        this.mesaId = mesaId;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(String horaInicio) {
        this.horaInicio = horaInicio;
    }

    public String getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(String horaFin) {
        this.horaFin = horaFin;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
