package com.sailor.controller;

import com.sailor.dto.CierreCajaCreateRequestDTO;
import com.sailor.dto.CierreCajaResponseDTO;
import com.sailor.dto.ResumenDiaDTO;
import com.sailor.entity.Usuario;
import com.sailor.repository.UsuarioRepository;
import com.sailor.service.CierreCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/cierre-caja")
public class CierreCajaController {

    @Autowired
    private CierreCajaService cierreCajaService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/resumen-dia")
    public ResumenDiaDTO getResumenDia(@RequestParam(required = false, defaultValue = "0.0") Double saldoInicial) {
        LocalDate today = LocalDate.now();
        return cierreCajaService.generateDailySummary(today, saldoInicial);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CierreCajaResponseDTO createCierre(@RequestBody CierreCajaCreateRequestDTO request,
                                               Authentication authentication) {
        try {
            String email = authentication.getName();
            Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario not found"));

            return cierreCajaService.createCierre(request, usuario);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping
    public List<CierreCajaResponseDTO> listAll() {
        return cierreCajaService.listAll();
    }
}
