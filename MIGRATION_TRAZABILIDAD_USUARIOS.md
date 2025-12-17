# Migración: Trazabilidad de Usuarios en Facturas y Pagos

## Contexto

El sistema de facturación y pagos no tenía registro de **quién** ejecutó las operaciones críticas. Esto dificultaba la auditoría y resolución de problemas.

## Solución Implementada

Se agregaron campos de trazabilidad para registrar el usuario responsable de cada operación:

1. **Facturas**: Campo `creada_por_usuario_id` que registra quién generó la factura
2. **Pagos**: Campo `registrado_por_usuario_id` que registra quién registró cada pago

Estos campos se setean automáticamente desde el `SecurityContext` (JWT) al momento de ejecutar la operación.

---

## Migración de Datos Existentes

### Problema

Las facturas y pagos que ya existen en la base de datos **no tienen** estos campos poblados (serán `NULL`). Esto no causa errores en el sistema, pero significa que los registros históricos no mostrarán información de trazabilidad.

### Opciones de Migración

#### Opción 1: No migrar datos históricos (Recomendado)

**Ventajas:**
- Simple y seguro
- No requiere SQL adicional
- Datos futuros tendrán trazabilidad completa

**Desventajas:**
- Registros antiguos mostrarán "(no disponible)" en la UI

**Acción:** Ninguna. Simplemente acepta que registros históricos no tienen trazabilidad.

---

#### Opción 2: Asignar usuario por defecto a registros históricos

**Solo ejecutar si realmente necesitas auditoría de datos históricos.**

```sql
-- Migración: Setear usuario admin como responsable de facturas/pagos históricos
-- ADVERTENCIA: Esto es una asignación artificial - el admin puede no haber sido el responsable real

-- 1. Obtener ID del usuario admin (ajustar email si es diferente)
SET @admin_user_id = (SELECT id FROM usuarios WHERE email = 'admin@sailor.com' LIMIT 1);

-- 2. Actualizar facturas sin creador
UPDATE facturas
SET creada_por_usuario_id = @admin_user_id
WHERE creada_por_usuario_id IS NULL;

-- 3. Actualizar pagos sin registrador
UPDATE pagos
SET registrado_por_usuario_id = @admin_user_id
WHERE registrado_por_usuario_id IS NULL;
```

**Nota importante:** Esta migración es **artificial**. Asigna al admin como responsable de todos los registros históricos, pero **no refleja la realidad** de quién realmente creó esas facturas/pagos. Úsala solo si necesitas evitar valores `NULL` en reportes.

---

## Validación Post-Migración

### Si NO migraste (Opción 1)

No requiere validación. El sistema funcionará correctamente. Las nuevas facturas/pagos tendrán trazabilidad.

### Si migraste con admin por defecto (Opción 2)

Valida que no queden registros sin usuario:

```sql
-- Debe retornar 0 facturas sin creador
SELECT COUNT(*) FROM facturas WHERE creada_por_usuario_id IS NULL;

-- Debe retornar 0 pagos sin registrador
SELECT COUNT(*) FROM pagos WHERE registrado_por_usuario_id IS NULL;
```

**Resultado esperado**: `0` en ambas queries.

---

## Ejecución de la Migración (solo si eliges Opción 2)

### Desde contenedor Docker

```bash
# Conectarse al contenedor de MySQL
docker exec -it sailor-db-1 mysql -u sailor -psailor123 sailor

# Ejecutar las queries de migración
SET @admin_user_id = (SELECT id FROM usuarios WHERE email = 'admin@sailor.com' LIMIT 1);

UPDATE facturas
SET creada_por_usuario_id = @admin_user_id
WHERE creada_por_usuario_id IS NULL;

UPDATE pagos
SET registrado_por_usuario_id = @admin_user_id
WHERE registrado_por_usuario_id IS NULL;

# Verificar
SELECT COUNT(*) FROM facturas WHERE creada_por_usuario_id IS NULL;
SELECT COUNT(*) FROM pagos WHERE registrado_por_usuario_id IS NULL;

# Salir
exit;
```

---

## Comportamiento Post-Implementación

### Facturas Nuevas

Cuando un usuario autenticado crea una factura:
1. El sistema obtiene el usuario actual desde `SecurityContext` (JWT)
2. Se setea `factura.creadaPorUsuario = currentUser`
3. El DTO de respuesta incluye `creadaPor` (email del usuario)
4. La UI muestra "Generada por: {email}" en el detalle de la factura

### Pagos Nuevos

Cuando un usuario autenticado registra un pago:
1. El sistema obtiene el usuario actual desde `SecurityContext`
2. Se setea `pago.registradoPorUsuario = currentUser`
3. El DTO de respuesta incluye `registradoPor` (email del usuario)
4. La UI muestra "Registrado por: {email}" en cada pago listado

### Visualización en UI

**FacturasPage:**
- Cabecera de factura muestra: "Generada por: admin@sailor.com"
- Cada pago listado muestra: "Registrado por: admin@sailor.com"
- Si el campo es `null` (datos antiguos sin migrar), no se muestra nada (limpio)

---

## Rollback (en caso de emergencia)

Si necesitas revertir los campos de trazabilidad:

```sql
-- Limpiar trazabilidad (volver a NULL)
UPDATE facturas SET creada_por_usuario_id = NULL;
UPDATE pagos SET registrado_por_usuario_id = NULL;
```

**Nota**: Esto hará que la información de trazabilidad desaparezca. Solo úsalo si hay un problema crítico.

---

## Checklist de Implementación

- [ ] (Opcional) Hacer backup de la base de datos antes de ejecutar migración
- [ ] Decidir si migrar datos históricos (Opción 1 o 2)
- [ ] Si Opción 2: Ejecutar SQL de migración
- [ ] Si Opción 2: Validar que no quedan NULLs
- [ ] Reconstruir y reiniciar containers: `docker compose down && docker compose up -d --build`
- [ ] Probar endpoint `POST /facturas` y verificar que `creadaPor` aparece en el JSON de respuesta
- [ ] Probar endpoint `POST /pagos` y verificar que `registradoPor` aparece en el JSON de respuesta
- [ ] Validar en la UI (FacturasPage) que se muestra "Generada por" y "Registrado por"

---

## Notas Técnicas

- Los campos `creada_por_usuario_id` y `registrado_por_usuario_id` son **nullable** por diseño
  - Esto permite que registros históricos existan sin romper el sistema
  - Facturas/pagos nuevos **siempre** tendrán estos campos seteados (non-null)
- Hibernate creará automáticamente las columnas en la tabla al iniciar la aplicación (gracias a `ddl-auto: update`)
- El helper `UsuarioService.getCurrentUsuario()` es reusable para futuras features que requieran auditoría
- La trazabilidad se captura al momento de la operación (transaccional con el save)
