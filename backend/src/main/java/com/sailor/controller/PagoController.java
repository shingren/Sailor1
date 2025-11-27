package com.sailor.controller;

import com.sailor.dto.FacturaResponseDTO;
import com.sailor.dto.PagoCreateRequestDTO;
import com.sailor.service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pagos")
public class PagoController {

    @Autowired
    private FacturaService facturaService;

    @PostMapping
    public FacturaResponseDTO registrarPago(@RequestBody PagoCreateRequestDTO request) {
        return facturaService.registrarPago(
            request.getFacturaId(),
            request.getMonto(),
            request.getMetodo()
        );
    }
}
