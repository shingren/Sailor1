package com.sailor.dto;

public class UsuarioEditRequestDTO {
    private String nombre;
    private String password; // optional - only if changing password

    public UsuarioEditRequestDTO() {}

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
