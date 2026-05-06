package com.sailor.controller;

import com.sailor.dto.CuentaResponseDTO;
import com.sailor.service.CuentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cuentas")
public class CuentaController {

    @Autowired
    private CuentaService cuentaService;

    @GetMapping("/abiertas")
    public List<CuentaResponseDTO> getCuentasAbiertas() {
        return cuentaService.getCuentasAbiertas();
    }

    @GetMapping("/listas-facturar")
    public List<CuentaResponseDTO> getCuentasListasParaFacturar() {
        return cuentaService.getCuentasListasParaFacturar();
    }

    @GetMapping("/{id}")
    public CuentaResponseDTO getCuentaById(@PathVariable Long id) {
        return cuentaService.getCuentaById(id)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + id));
    }

    @GetMapping("/{id}/ticket")
    public String getTicketCuenta(@PathVariable Long id) {
        return cuentaService.generarTicketCuenta(id);
    }

    @PostMapping("/{id}/pagar")
    public CuentaResponseDTO pagarCuenta(@PathVariable Long id) {
        return cuentaService.pagarCuenta(id);
    }
}