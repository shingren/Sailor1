# Diseño UI - Menú Grid Optimizado para Tablets

## Auditoría de UI Actual

### Archivos principales:
- `frontend/src/PedidosPage.jsx` - Vista completa de pedidos con POS integrado

### Estructura actual (problemas identificados):

1. **Categorías**: Botones horizontales con flex-wrap ✅ (funciona bien)
2. **Productos**: Grid 2D con scroll vertical limitado (500px) ⚠️ (scroll incómodo)
3. **Extras**: Panel lateral derecho pequeño (1/3 espacio) ❌ (cramped, difícil de ver)
4. **Búsqueda**: No existe ❌
5. **Resumen pedido**: Scroll separado abajo ⚠️ (no visible mientras seleccionas)

### Datos del backend (OK, no cambios necesarios):
- `GET /api/productos` → [{id, nombre, descripcion, precio, categoria, activo}]
- `GET /api/recetas` → [{productoId, extras: [{id, nombre, precio, cantidadInsumo}]}]
- `GET /api/mesas` → [{id, codigo, capacidad, estado}]

---

## Propuesta Nueva UX - Layout Tablet-First

### 🎯 Objetivo
Interfaz tipo "restaurante POS" con grid grande de productos, modal espacioso para extras, y carrito siempre visible.

### 📐 Layout Principal

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER FIJO (sticky top)                                        │
│  [Mesa: A1 ▼] │ Total: $45.50 │ [Ver Pedido (3)] [Crear]      │
└─────────────────────────────────────────────────────────────────┘
│ SEARCH BAR                                                       │
│  🔍 [Buscar productos...]                                       │
├─────────────────────────────────────────────────────────────────┤
│ CATEGORÍAS (horizontal scroll/chips)                            │
│  [TODOS] [PLATOS] [BEBIDAS] [POSTRES] [ENTRADAS]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ GRID DE PRODUCTOS (3-4 cols en tablet, 2-3 en mobile)          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Hamburguesa│ │ Pizza    │ │ Pasta    │ │ Ensalada │       │
│  │ $12.50   │ │ $18.00   │ │ $15.00   │ │ $8.50    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ ...      │ │ ...      │ │ ...      │ │ ...      │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│ (scroll infinito o paginado)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 🔲 Modal de Producto + Extras

Cuando usuario toca un producto:

```
┌─────────────────────────────────────────┐
│ ✕ CERRAR                                │
│                                          │
│ HAMBURGUESA CLÁSICA                     │
│ $12.50                                   │
│                                          │
│ Cantidad:  [-] 2 [+]                    │
│                                          │
│ ─────────────────────────────────────── │
│ EXTRAS DISPONIBLES                       │
│                                          │
│ ┌────────────────────────────┐          │
│ │ ☐ Queso Extra                         │
│ │    +$2.00    [-] 0 [+]                │
│ └────────────────────────────┘          │
│                                          │
│ ┌────────────────────────────┐          │
│ │ ☑ Tocino                              │
│ │    +$3.50    [-] 1 [+]                │
│ └────────────────────────────┘          │
│                                          │
│ ┌────────────────────────────┐          │
│ │ ☐ Aguacate                            │
│ │    +$2.50    [-] 0 [+]                │
│ └────────────────────────────┘          │
│                                          │
│ ─────────────────────────────────────── │
│ Subtotal: $16.00                        │
│ (2x Hamburguesa + 1x Tocino)           │
│                                          │
│ [ AGREGAR AL PEDIDO ]                   │
└─────────────────────────────────────────┘
```

### 🛒 Panel de Pedido (Bottom Drawer o Side Panel)

Dos opciones:
1. **Bottom Drawer** (recomendado mobile): Sube desde abajo al tocar "Ver Pedido"
2. **Side Panel** (recomendado tablet): Panel derecho fijo/colapsable

```
RESUMEN DEL PEDIDO (3 items)
─────────────────────────────
2x Hamburguesa c/Tocino
   $16.00                [X]

1x Pizza Margarita
   $18.00                [X]

1x Coca-Cola
   $3.50                 [X]
─────────────────────────────
TOTAL:                $37.50
─────────────────────────────
Observaciones:
[____________]

[CREAR PEDIDO] [LIMPIAR]
```

---

## 🎨 Componentes a Crear/Modificar

### Nuevos componentes:
1. `MenuGridView.jsx` - Vista principal con grid de productos
2. `ProductCard.jsx` - Card individual de producto
3. `ProductModal.jsx` - Modal para seleccionar cantidad + extras
4. `OrderSummary.jsx` - Panel/drawer del pedido actual

### Componentes a reutilizar:
- CategoryChips (inline en MenuGridView)
- SearchBar (nuevo, simple)

---

## 📊 Estado de la aplicación

```javascript
// Estado principal (MenuGridView)
{
  selectedMesaId: number | null,
  searchQuery: string,
  selectedCategory: string, // 'TODOS' | categoría del backend
  cart: [{
    productoId: number,
    cantidad: number,
    extras: [{recetaExtraId, cantidad, nombre, precio}]
  }],
  showProductModal: boolean,
  modalProduct: {id, nombre, precio} | null
}
```

---

## 🔍 Flujo de Usuario

1. **Seleccionar mesa** → Header fijo muestra mesa actual
2. **Buscar/filtrar** → Usa search bar o chips de categoría
3. **Tocar producto** → Abre ProductModal
4. **En modal**:
   - Ajustar cantidad
   - Seleccionar extras (stepper 0..n)
   - Ver subtotal actualizado
   - "Agregar al Pedido" → Cierra modal, añade a cart
5. **Ver resumen** → Toca "Ver Pedido (3)" en header
6. **Editar/eliminar items** → Desde OrderSummary
7. **Crear pedido** → POST /api/pedidos con estructura actual

---

## ✅ Checklist de Implementación

- [ ] MenuGridView component base
- [ ] ProductCard component
- [ ] ProductModal con extras
- [ ] OrderSummary panel/drawer
- [ ] Search/filter logic
- [ ] Responsive grid (3-4 cols tablet, 2 mobile)
- [ ] Cálculo de totales correcto
- [ ] Compatibilidad con endpoints actuales
- [ ] UX tablet-friendly (touch targets 48x48px mínimo)
- [ ] Performance (evitar re-renders innecesarios)

---

## 🚀 Plan de Implementación

1. **Fase 1**: Crear MenuGridView.jsx con grid básico (sin modal)
2. **Fase 2**: Implementar ProductModal con extras
3. **Fase 3**: Implementar OrderSummary
4. **Fase 4**: Integrar search y filtros
5. **Fase 5**: Testing y ajustes responsive

**Nota**: Mantener PedidosPage.jsx original como fallback hasta validar la nueva UI.
