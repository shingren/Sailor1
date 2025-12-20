# Checklist de Validación - Menú Grid Optimizado

## 🎯 Objetivo
Validar la nueva interfaz de menú tipo grid optimizada para tablets, incluyendo selección de productos, manejo de extras, y creación de pedidos.

---

## ✅ Checklist de Funcionalidad

### 1. Navegación y Acceso
- [ ] Acceder a `/menu` como usuario ADMIN o MESERO
- [ ] Verificar que usuarios sin rol apropiado reciban NotAuthorized
- [ ] Header fijo permanece visible al hacer scroll
- [ ] Página carga correctamente productos, mesas y recetas

### 2. Selección de Mesa
- [ ] Dropdown de mesas muestra todas las mesas disponibles
- [ ] Se puede seleccionar una mesa
- [ ] Mesa pre-seleccionada desde query parameter `?mesaId=X` funciona
- [ ] Campo de mesa es requerido para crear pedido

### 3. Búsqueda y Filtros
- [ ] Barra de búsqueda filtra productos por nombre
- [ ] Búsqueda filtra productos por descripción
- [ ] Búsqueda actualiza grid en tiempo real (sin lag)
- [ ] Búsqueda vacía muestra todos los productos de la categoría

### 4. Categorías
- [ ] Chips de categorías muestran "TODOS" + categorías del backend
- [ ] Click en categoría filtra productos correctamente
- [ ] Categoría "TODOS" muestra todos los productos activos
- [ ] Scroll horizontal funciona en categorías (mobile/tablet)
- [ ] Categoría seleccionada tiene estilo visual diferenciado

### 5. Grid de Productos
- [ ] Productos se muestran en grid responsive (3-4 cols en tablet)
- [ ] ProductCard muestra: nombre, precio, categoría, descripción
- [ ] Click en ProductCard abre modal de producto
- [ ] Productos inactivos NO aparecen en el grid
- [ ] Grid ajusta columnas según tamaño de pantalla
- [ ] No hay productos duplicados en el grid

### 6. Modal de Producto
- [ ] Modal abre correctamente al clickear producto
- [ ] Modal muestra información completa del producto
- [ ] Botón "✕" cierra el modal
- [ ] Click fuera del modal lo cierra
- [ ] Modal es scrollable si hay muchos extras

### 7. Selección de Cantidad (Modal)
- [ ] Botón "-" decrementa cantidad (mínimo 1)
- [ ] Botón "+" incrementa cantidad
- [ ] Cantidad se muestra correctamente
- [ ] Cantidad inicial es 1 al abrir modal
- [ ] Targets de botones son >= 48x48px (tablet-friendly)

### 8. Selección de Extras (Modal)
- [ ] Extras disponibles se muestran si el producto los tiene
- [ ] Productos sin extras no muestran sección de extras
- [ ] Botón "-" decrementa cantidad de extra (mínimo 0)
- [ ] Botón "+" incrementa cantidad de extra
- [ ] Extra con cantidad > 0 tiene estilo visual diferenciado
- [ ] Precio de cada extra se muestra correctamente
- [ ] Subtotal actualiza al cambiar extras

### 9. Cálculo de Subtotal (Modal)
- [ ] Subtotal = (precio base × cantidad) + (extras × cantidad)
- [ ] Subtotal actualiza al cambiar cantidad de producto
- [ ] Subtotal actualiza al agregar/quitar extras
- [ ] Subtotal se muestra con 2 decimales
- [ ] Desglose muestra cantidad de cada ítem/extra

### 10. Agregar al Carrito
- [ ] Botón "Agregar al Pedido" añade ítem al carrito
- [ ] Modal se cierra después de agregar
- [ ] Carrito muestra cantidad correcta en badge del header
- [ ] Total en header actualiza inmediatamente
- [ ] Se pueden agregar múltiples ítems del mismo producto

### 11. Panel de Resumen del Pedido
- [ ] Botón "Ver Pedido" abre panel lateral
- [ ] Panel muestra todos los ítems en el carrito
- [ ] Badge en botón muestra cantidad de ítems
- [ ] Panel es scrollable si hay muchos ítems
- [ ] Click fuera del panel lo cierra
- [ ] Botón "✕" cierra el panel

### 12. Ítems del Carrito (Panel)
- [ ] Cada ítem muestra: cantidad, nombre, precio total
- [ ] Extras se muestran como sub-items indentados
- [ ] Botón eliminar (✕) remueve ítem del carrito
- [ ] Total del carrito actualiza al eliminar ítems
- [ ] Carrito vacío muestra mensaje apropiado

### 13. Total del Pedido
- [ ] Total se calcula correctamente
- [ ] Total incluye precio base de productos
- [ ] Total incluye precio de extras × cantidad × cantidad de producto
- [ ] Total se muestra en header y en panel
- [ ] Total se muestra con 2 decimales

### 14. Observaciones
- [ ] Campo de observaciones es visible en panel
- [ ] Se puede escribir texto en observaciones
- [ ] Observaciones se envían con el pedido

### 15. Crear Pedido
- [ ] Botón "Crear Pedido" deshabilitado si no hay mesa
- [ ] Botón "Crear Pedido" deshabilitado si carrito vacío
- [ ] Click en "Crear Pedido" envía POST a `/api/pedidos`
- [ ] Pedido creado correctamente (verificar en backend)
- [ ] Mensaje de éxito aparece después de crear
- [ ] Carrito se limpia después de crear
- [ ] Observaciones se limpian después de crear
- [ ] Panel se cierra después de crear

### 16. Limpiar Carrito
- [ ] Botón "Limpiar Carrito" pide confirmación
- [ ] Confirmar vacía todos los ítems del carrito
- [ ] Cancelar no vacía el carrito
- [ ] Total vuelve a $0.00

---

## 🎨 Validación Visual y UX

### 17. Responsive Design
- [ ] Grid responsive en tablet (3-4 columnas)
- [ ] Grid responsive en mobile (2 columnas)
- [ ] Modal responsive (max-width, padding apropiado)
- [ ] Panel lateral responsivo en mobile (full-width)
- [ ] Texto legible en todos los tamaños de pantalla

### 18. Touch Targets (Tablet/Mobile)
- [ ] Todos los botones >= 48x48px
- [ ] Cards de productos tienen buen tap area
- [ ] Chips de categorías tienen buen tap area
- [ ] Botones +/- en modal son grandes
- [ ] Botones de eliminar son accesibles

### 19. Estados Visuales
- [ ] Hover en ProductCard cambia border/sombra
- [ ] Categoría seleccionada tiene borde verde
- [ ] Extra seleccionado tiene fondo verde claro
- [ ] Botones deshabilitados tienen estilo gris
- [ ] Loading states muestran indicador

### 20. Mensajes y Feedback
- [ ] Error messages se muestran en rojo
- [ ] Success messages se muestran en verde
- [ ] Empty states tienen íconos y mensaje claro
- [ ] "Carrito vacío" muestra ícono + texto
- [ ] "No productos" muestra mensaje útil

---

## ⚡ Validación de Performance

### 21. Rendimiento
- [ ] Grid no re-renderiza al teclear en búsqueda (debounce o memo)
- [ ] Scroll suave sin lag
- [ ] Modal abre/cierra sin flicker
- [ ] Agregar al carrito es instantáneo
- [ ] Filtros de categoría son instantáneos

### 22. Datos y Estado
- [ ] Estado del carrito persiste al navegar entre categorías
- [ ] Búsqueda no afecta carrito
- [ ] Modal resetea estado al abrir nuevo producto
- [ ] No hay memory leaks (modal se limpia al cerrar)

---

## 🔗 Validación de Integración

### 23. Backend Endpoints
- [ ] GET `/api/productos` retorna productos correctos
- [ ] GET `/api/mesas` retorna mesas correctas
- [ ] GET `/api/recetas` retorna recetas con extras
- [ ] POST `/api/pedidos` acepta estructura correcta
- [ ] POST `/api/pedidos` retorna 200 OK en éxito

### 24. Estructura de Datos Enviada
- [ ] `mesaId` es un número
- [ ] `items` es un array
- [ ] Cada item tiene `productoId`, `cantidad`
- [ ] Cada item tiene `extras` array (puede estar vacío)
- [ ] Cada extra tiene `recetaExtraId`, `cantidad`
- [ ] `observaciones` es un string (puede estar vacío)

---

## 🧪 Casos de Prueba Específicos

### Test Case 1: Pedido Simple (sin extras)
1. Seleccionar mesa "A1"
2. Click en "Hamburguesa" ($12.50)
3. Cantidad = 2
4. Click "Agregar al Pedido"
5. Verificar: Total = $25.00
6. Click "Crear Pedido"
7. Verificar: Pedido creado con 1 ítem, 2 unidades

### Test Case 2: Pedido con Extras
1. Seleccionar mesa "A1"
2. Click en "Pizza" ($18.00)
3. Cantidad = 1
4. Agregar extra "Queso" (+$2.00) × 1
5. Agregar extra "Tocino" (+$3.50) × 2
6. Verificar subtotal = $18 + $2 + ($3.50 × 2) = $27.00
7. Click "Agregar al Pedido"
8. Verificar: Total = $27.00
9. Click "Crear Pedido"
10. Verificar: Pedido creado con extras correctos

### Test Case 3: Pedido Múltiple con Extras
1. Seleccionar mesa "B2"
2. Agregar: 2x Hamburguesa c/Queso ($12.50 + $2.00)
3. Agregar: 1x Pizza c/Tocino ($18.00 + $3.50)
4. Agregar: 3x Coca-Cola ($3.00)
5. Verificar total = ($14.50 × 2) + $21.50 + ($3.00 × 3) = $67.50
6. Agregar observaciones: "Sin cebolla en la hamburguesa"
7. Click "Crear Pedido"
8. Verificar: Pedido con 3 ítems, observaciones incluidas

### Test Case 4: Búsqueda y Filtros
1. Buscar "ham"
2. Verificar: Solo muestra "Hamburguesa"
3. Limpiar búsqueda
4. Seleccionar categoría "BEBIDAS"
5. Verificar: Solo muestra bebidas
6. Seleccionar "TODOS"
7. Verificar: Muestra todos los productos

### Test Case 5: Editar Carrito
1. Agregar 2x Hamburguesa
2. Agregar 1x Pizza
3. Ver pedido
4. Eliminar Hamburguesa
5. Verificar: Solo queda Pizza en carrito
6. Verificar: Total actualizado
7. Limpiar carrito
8. Verificar: Carrito vacío

---

## 📱 Validación Cross-Browser/Device

### 26. Navegadores
- [ ] Chrome/Edge (Windows)
- [ ] Firefox (Windows)
- [ ] Safari (macOS/iOS)
- [ ] Chrome (Android)

### 27. Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Tablet landscape (1024x768)
- [ ] Tablet portrait (768x1024)
- [ ] Mobile (375x667)

---

## 🏁 Criterios de Éxito

✅ **APROBADO** si:
- Todos los items críticos (1-16) pasan
- Al menos 90% de items totales pasan
- No hay errores en consola del navegador
- Pedidos se crean correctamente en backend

❌ **RECHAZADO** si:
- Algún item crítico falla
- Menos de 80% de items totales pasan
- Errores de consola impiden funcionalidad
- Pedidos no se crean o tienen estructura incorrecta

---

## 📝 Notas de Prueba

Fecha: _____________
Probado por: _____________
Navegador: _____________
Dispositivo: _____________

### Bugs Encontrados:
1. _____________
2. _____________
3. _____________

### Mejoras Sugeridas:
1. _____________
2. _____________
3. _____________

---

**Firma**: _________________ **Fecha**: _________________
