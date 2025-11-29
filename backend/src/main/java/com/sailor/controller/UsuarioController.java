package com.sailor.controller;

import com.sailor.dto.UsuarioCreateRequestDTO;
import com.sailor.dto.UsuarioResponseDTO;
import com.sailor.dto.UsuarioRoleUpdateRequestDTO;
import com.sailor.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public List<UsuarioResponseDTO> getAllUsuarios() {
        return usuarioService.getAllUsuarios();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO createUsuario(@RequestBody UsuarioCreateRequestDTO request) {
        return usuarioService.createUsuario(request);
    }

    @PutMapping("/{id}/rol")
    public UsuarioResponseDTO updateRol(@PathVariable Long id, @RequestBody UsuarioRoleUpdateRequestDTO request) {
        return usuarioService.updateRol(id, request.getRol());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUsuario(@PathVariable Long id) {
        usuarioService.deleteUsuario(id);
    }
}
