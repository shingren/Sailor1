package com.sailor.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "pedido_item_extras")
public class PedidoItemExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pedido_item_id", nullable = false)
    private PedidoItem pedidoItem;

    @ManyToOne
    @JoinColumn(name = "receta_extra_id", nullable = false)
    private RecetaExtra recetaExtra;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false)
    private double precioUnitario;

    public PedidoItemExtra() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PedidoItem getPedidoItem() {
        return pedidoItem;
    }

    public void setPedidoItem(PedidoItem pedidoItem) {
        this.pedidoItem = pedidoItem;
    }

    public RecetaExtra getRecetaExtra() {
        return recetaExtra;
    }

    public void setRecetaExtra(RecetaExtra recetaExtra) {
        this.recetaExtra = recetaExtra;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }
}
