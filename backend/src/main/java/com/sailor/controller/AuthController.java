package com.sailor.controller;

import com.sailor.dto.*;
import com.sailor.entity.Usuario;
import com.sailor.repository.UsuarioRepository;
import com.sailor.service.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Get Usuario to extract rol
            Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String accessToken = jwtUtil.generateAccessToken(usuario.getEmail(), usuario.getRol());
            String refreshToken = jwtUtil.generateRefreshToken(usuario.getEmail(), usuario.getRol());

            return new LoginResponseDTO(accessToken, refreshToken, usuario.getEmail(), usuario.getRol());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
    }

    @PostMapping("/refresh")
    public RefreshTokenResponseDTO refresh(@RequestBody RefreshTokenRequestDTO request) {
        try {
            String refreshToken = request.getRefreshToken();

            if (!jwtUtil.validateToken(refreshToken)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
            }

            String username = jwtUtil.extractUsername(refreshToken);
            String rol = jwtUtil.extractRol(refreshToken);

            String newAccessToken = jwtUtil.generateAccessToken(username, rol);

            return new RefreshTokenResponseDTO(newAccessToken);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }
}
