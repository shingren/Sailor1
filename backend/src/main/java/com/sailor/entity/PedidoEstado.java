package com.sailor.entity;

public enum PedidoEstado {
    PENDIENTE,
    PREPARACION,
    LISTO,
    ENTREGADO;

    public static boolean isValid(String estado) {
        if (estado == null) return false;
        try {
            valueOf(estado);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public static boolean isValidTransition(String from, String to) {
        if (!isValid(from) || !isValid(to)) return false;

        PedidoEstado fromEstado = valueOf(from);
        PedidoEstado toEstado = valueOf(to);

        switch (fromEstado) {
            case PENDIENTE:
                return toEstado == PREPARACION;
            case PREPARACION:
                return toEstado == LISTO;
            case LISTO:
                return toEstado == ENTREGADO;
            case ENTREGADO:
                return false;
            default:
                return false;
        }
    }
}
