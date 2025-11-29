package com.sailor.dto;

public class LoginResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String email;
    private String rol;

    public LoginResponseDTO() {}

    public LoginResponseDTO(String accessToken, String refreshToken, String email, String rol) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.email = email;
        this.rol = rol;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
