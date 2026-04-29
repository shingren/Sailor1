package com.sailor.dto;

import java.util.List;

public class PedidoCreateRequestDTO {
    private Long mesaId;
    private String observaciones;
    private Boolean paraLlevar; // ⭐ 新增：是否打包
    private List<PedidoItemRequestDTO> items;

    public PedidoCreateRequestDTO() {
    }

    public Long getMesaId() {
        return mesaId;
    }

    public void setMesaId(Long mesaId) {
        this.mesaId = mesaId;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Boolean getParaLlevar() {
        return paraLlevar;
    }

    public void setParaLlevar(Boolean paraLlevar) {
        this.paraLlevar = paraLlevar;
    }

    public List<PedidoItemRequestDTO> getItems() {
        return items;
    }

    public void setItems(List<PedidoItemRequestDTO> items) {
        this.items = items;
    }
}