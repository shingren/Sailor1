# Checklist de UX - Facturación y Pagos

Este documento detalla las mejoras de experiencia de usuario implementadas para las acciones críticas de facturación y pagos, y cómo validarlas manualmente.

---

## Mejoras Implementadas

### 1. Confirmación antes de Generar Factura

**Ubicación en la app**: Página de Facturas (`/facturas`)

**Acciones que requieren confirmación**:
- Generar factura desde formulario manual (ingresando ID de pedido)
- Generar factura desde tabla "Pedidos Listos para Facturar" (botón directo)

**Texto del diálogo de confirmación**:
```
¿Confirmas generar la factura para el pedido #X (Mesa Y) por $TOTAL?

Esta acción no se puede deshacer.
```

**Comportamiento esperado**:
- ✓ Al hacer clic en "Generar Factura", aparece diálogo de confirmación
- ✓ Botón "Cancelar" → No se crea factura, no se ejecuta API call
- ✓ Botón "Aceptar" → Se crea factura, se muestra mensaje de éxito

**Mensaje de éxito tras crear factura**:
```
Factura #ID generada exitosamente para el pedido #PEDIDO_ID
```

---

### 2. Confirmación antes de Registrar Pago

**Ubicación en la app**: Página de Facturas, sección "Facturas Recientes", facturas en estado PENDIENTE

**Texto del diálogo de confirmación**:

#### Para Pago Parcial:
```
Resumen del Pago:

Factura #ID
Total: $XXX
Total Pagado: $YYY
Saldo Pendiente: $ZZZ

Monto a Registrar: $MMM
Método: EFECTIVO/TARJETA

⚠️ PAGO PARCIAL

Esto dejará la factura en estado PENDIENTE con saldo pendiente de $NUEVO_SALDO.

¿Deseas continuar?
```

#### Para Pago Total:
```
Resumen del Pago:

Factura #ID
Total: $XXX
Total Pagado: $YYY
Saldo Pendiente: $ZZZ

Monto a Registrar: $MMM
Método: EFECTIVO/TARJETA

✓ PAGO TOTAL

Esto marcará la factura como PAGADA y el pedido como PAGADO.

¿Confirmas registrar el pago?
```

**Comportamiento esperado**:
- ✓ Al hacer clic en "Registrar Pago", aparece diálogo con resumen completo
- ✓ Warning visible para pagos parciales
- ✓ Confirmación clara para pagos totales
- ✓ Botón "Cancelar" → No se registra pago
- ✓ Botón "Aceptar" → Se registra pago, se muestra mensaje de éxito

**Mensajes de éxito tras registrar pago**:

- **Pago parcial**: `Pago parcial de $MMM registrado exitosamente. Saldo pendiente: $SALDO`
- **Pago total**: `Pago registrado exitosamente. Factura #ID marcada como PAGADA.`

---

### 3. Validación Defensiva en UI

**Ubicación**: Formulario de registro de pago en cada factura PENDIENTE

**Validaciones implementadas**:

1. **Monto <= 0**:
   - ✓ Botón "Registrar Pago" DESHABILITADO
   - ✓ Warning mostrado: "⚠️ El monto debe ser mayor a 0."

2. **Monto > Saldo Pendiente** (sobrepago):
   - ✓ Botón "Registrar Pago" DESHABILITADO
   - ✓ Warning mostrado: "⚠️ El monto excede el saldo pendiente. No se permiten sobrepagos."

3. **Método de pago no seleccionado**:
   - ✓ Botón "Registrar Pago" DESHABILITADO

4. **Monto vacío**:
   - ✓ Botón "Registrar Pago" DESHABILITADO

**Comportamiento esperado**:
- ✓ Usuario no puede hacer clic en "Registrar Pago" si hay validaciones fallando
- ✓ Warnings visibles en color rojo (#dc2626) y con ícono ⚠️
- ✓ Reduce intentos fallidos y mejora UX del cajero

---

### 4. Feedback Visual Claro

**Estados de factura**:
- **PENDIENTE**: Badge amarillo
- **PAGADA**: Badge verde

**Mensajes de éxito**:
- Fondo verde con clase `alert-success`
- Texto claro y específico sobre lo que ocurrió

**Mensajes de error**:
- Fondo rojo con clase `alert-error`
- Texto descriptivo del problema

---

## Checklist de Pruebas Manuales

### Caso 1: Confirmación al Generar Factura

1. ✓ Ir a `/facturas`
2. ✓ En "Pedidos Listos para Facturar", hacer clic en "Generar Factura"
3. ✓ Verificar que aparece diálogo con: pedido ID, mesa, total, y texto "Esta acción no se puede deshacer"
4. ✓ Hacer clic en "Cancelar" → Verificar que NO se crea factura
5. ✓ Repetir, hacer clic en "Aceptar" → Verificar que se crea factura y aparece mensaje de éxito verde

---

### Caso 2: Confirmación al Registrar Pago Parcial

1. ✓ En "Facturas Recientes", seleccionar una factura PENDIENTE
2. ✓ Modificar el monto pre-llenado a un valor menor que el saldo (ej: si saldo es 10000, ingresar 5000)
3. ✓ Seleccionar método de pago (EFECTIVO o TARJETA)
4. ✓ Hacer clic en "Registrar Pago"
5. ✓ Verificar diálogo con:
   - Resumen de factura (total, total pagado, saldo pendiente)
   - Monto a registrar y método
   - Warning "⚠️ PAGO PARCIAL"
   - Texto "Esto dejará la factura en estado PENDIENTE con saldo pendiente de $..."
6. ✓ Hacer clic en "Aceptar" → Verificar mensaje de éxito con saldo pendiente actualizado
7. ✓ Verificar que factura sigue en estado PENDIENTE con saldo reducido

---

### Caso 3: Confirmación al Registrar Pago Total

1. ✓ En una factura PENDIENTE, verificar que el monto está pre-llenado con el saldo pendiente exacto
2. ✓ Seleccionar método de pago
3. ✓ Hacer clic en "Registrar Pago"
4. ✓ Verificar diálogo con:
   - Resumen completo
   - "✓ PAGO TOTAL"
   - Texto "Esto marcará la factura como PAGADA y el pedido como PAGADO"
5. ✓ Hacer clic en "Aceptar" → Verificar mensaje de éxito "Factura marcada como PAGADA"
6. ✓ Verificar que factura cambia a estado PAGADA (badge verde)
7. ✓ Verificar que desaparece el formulario de pago (solo se muestra en PENDIENTE)

---

### Caso 4: Validación Defensiva - Sobrepago

1. ✓ En una factura PENDIENTE con saldo pendiente de (ej) 10000
2. ✓ Ingresar monto mayor al saldo (ej: 99999)
3. ✓ Verificar que aparece warning rojo: "⚠️ El monto excede el saldo pendiente. No se permiten sobrepagos."
4. ✓ Verificar que botón "Registrar Pago" está DESHABILITADO (gris, no clickeable)
5. ✓ Reducir monto a valor válido → Verificar que warning desaparece y botón se habilita

---

### Caso 5: Validación Defensiva - Monto Inválido

1. ✓ En una factura PENDIENTE, ingresar monto = 0
2. ✓ Verificar warning: "⚠️ El monto debe ser mayor a 0."
3. ✓ Verificar botón "Registrar Pago" deshabilitado
4. ✓ Ingresar monto negativo (ej: -100)
5. ✓ Verificar mismo comportamiento
6. ✓ Ingresar monto vacío → Botón deshabilitado

---

### Caso 6: Validación Defensiva - Método No Seleccionado

1. ✓ En una factura PENDIENTE con monto válido
2. ✓ Dejar método de pago en "-- Seleccionar --"
3. ✓ Verificar que botón "Registrar Pago" está deshabilitado
4. ✓ Seleccionar método → Botón se habilita

---

### Caso 7: Mensajes de Éxito Visibles

1. ✓ Crear una factura → Verificar mensaje verde en la parte superior
2. ✓ Registrar un pago → Verificar mensaje verde específico
3. ✓ Verificar que mensaje desaparece al crear nueva factura o pago (se reemplaza)

---

## Resumen de Textos Exactos de Confirmación

### Generar Factura (con info de pedido):
```
¿Confirmas generar la factura para el pedido #18 (Mesa A1) por $11,300.00?

Esta acción no se puede deshacer.
```

### Generar Factura (sin info de pedido):
```
¿Confirmas generar la factura para el pedido #18?

Esta acción no se puede deshacer.
```

### Registrar Pago Parcial:
```
Resumen del Pago:

Factura #18
Total: $11,300.00
Total Pagado: $0.00
Saldo Pendiente: $11,300.00

Monto a Registrar: $5,000.00
Método: EFECTIVO

⚠️ PAGO PARCIAL

Esto dejará la factura en estado PENDIENTE con saldo pendiente de $6,300.00.

¿Deseas continuar?
```

### Registrar Pago Total:
```
Resumen del Pago:

Factura #18
Total: $11,300.00
Total Pagado: $5,000.00
Saldo Pendiente: $6,300.00

Monto a Registrar: $6,300.00
Método: TARJETA

✓ PAGO TOTAL

Esto marcará la factura como PAGADA y el pedido como PAGADO.

¿Confirmas registrar el pago?
```

---

## Dónde Probar en la App

1. **Acceso**: https://localhost/facturas (con usuario admin@sailor.com / admin123 o user@sailor.com / user123)
2. **Sección "Pedidos Listos para Facturar"**: Tabla con pedidos en estado ENTREGADO sin factura
3. **Sección "Facturas Recientes"**: Lista de facturas creadas, con formulario de pago en las PENDIENTES

---

## Checklist de Validación Final

- ✓ Confirmación al generar factura (2 lugares: formulario manual + tabla pedidos listos)
- ✓ Confirmación al registrar pago con resumen completo
- ✓ Warning para pagos parciales
- ✓ Confirmación clara para pagos totales
- ✓ Botón deshabilitado para monto <= 0
- ✓ Botón deshabilitado para monto > saldo pendiente
- ✓ Warning visible cuando monto excede saldo
- ✓ Botón deshabilitado si método no seleccionado
- ✓ Mensajes de éxito verdes y claros tras crear factura
- ✓ Mensajes de éxito verdes y claros tras registrar pago
- ✓ Mensajes de error rojos y descriptivos

---

## Notas para Futuro

- **Anulación de facturas**: No implementada aún. Preparación UX: se podría agregar botón "Anular" solo visible para rol ADMIN, con confirmación similar ("Esta acción no se puede deshacer").
- **Cancelación de pagos**: No implementada. Requeriría endpoint nuevo y lógica de reversión de estado de factura.
