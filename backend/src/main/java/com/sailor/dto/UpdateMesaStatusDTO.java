package com.sailor.dto;

public class UpdateMesaStatusDTO {
    private String estado;

    public UpdateMesaStatusDTO() {
    }

    public UpdateMesaStatusDTO(String estado) {
        this.estado = estado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
