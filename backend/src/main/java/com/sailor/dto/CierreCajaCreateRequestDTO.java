package com.sailor.dto;

public class CierreCajaCreateRequestDTO {

    private Double saldoReal;
    private Double saldoInicial = 0.0;

    public CierreCajaCreateRequestDTO() {
    }

    public Double getSaldoReal() {
        return saldoReal;
    }

    public void setSaldoReal(Double saldoReal) {
        this.saldoReal = saldoReal;
    }

    public Double getSaldoInicial() {
        return saldoInicial;
    }

    public void setSaldoInicial(Double saldoInicial) {
        this.saldoInicial = saldoInicial;
    }
}
