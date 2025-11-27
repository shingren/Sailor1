package com.sailor.dto;

public class FacturaCreateRequestDTO {
    private Long pedidoId;

    public FacturaCreateRequestDTO() {
    }

    public Long getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(Long pedidoId) {
        this.pedidoId = pedidoId;
    }
}
