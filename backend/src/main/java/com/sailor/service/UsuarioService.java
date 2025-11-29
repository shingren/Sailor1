package com.sailor.service;

import com.sailor.dto.UsuarioCreateRequestDTO;
import com.sailor.dto.UsuarioResponseDTO;
import com.sailor.entity.Usuario;
import com.sailor.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UsuarioResponseDTO> getAllUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public UsuarioResponseDTO createUsuario(UsuarioCreateRequestDTO request) {
        // Check if email already exists
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        // Create new usuario
        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(request.getRol());

        Usuario saved = usuarioRepository.save(usuario);
        return mapToResponseDTO(saved);
    }

    public UsuarioResponseDTO updateRol(Long id, String newRol) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario not found with id: " + id));

        usuario.setRol(newRol);
        Usuario updated = usuarioRepository.save(usuario);
        return mapToResponseDTO(updated);
    }

    public void deleteUsuario(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuario not found with id: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    private UsuarioResponseDTO mapToResponseDTO(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getRol()
        );
    }
}
