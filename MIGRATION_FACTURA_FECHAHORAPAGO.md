# Migración: Agregar campo fechaHoraPago a Facturas

## Contexto

El sistema de Cierre de Caja tenía un bug crítico: calculaba los totales del día basándose en la **fecha de creación de la factura** (`facturas.fecha_hora`), no en la **fecha del pago**. Esto causaba descuadres cuando una factura se creaba un día pero se pagaba al siguiente.

## Solución Implementada

Se agregó el campo `fecha_hora_pago` a la tabla `facturas` para registrar **cuándo** una factura fue completamente pagada. Este campo se setea automáticamente cuando la factura transiciona a estado `PAGADA`.

---

## Migración de Datos Existentes

### Problema

Las facturas que ya están en estado `PAGADA` en la base de datos **no tienen** `fecha_hora_pago` seteada (será `NULL`). Esto causará que no se cuenten en los cierres de caja hasta que ejecutes la migración.

### SQL de Migración

Ejecuta el siguiente SQL para poblar `fecha_hora_pago` en facturas ya pagadas:

```sql
-- Migración: Setear fecha_hora_pago para facturas PAGADAS existentes
-- basándose en el último pago registrado

UPDATE facturas f
SET fecha_hora_pago = (
    SELECT MAX(p.fecha_hora)
    FROM pagos p
    WHERE p.factura_id = f.id
)
WHERE f.estado = 'PAGADA'
  AND f.fecha_hora_pago IS NULL;
```

### Explicación

- Para cada factura en estado `PAGADA` que no tiene `fecha_hora_pago`:
  - Se busca el **último pago** (`MAX(p.fecha_hora)`) de esa factura
  - Se usa esa fecha como `fecha_hora_pago`
- Esto es razonable porque la factura se considera "pagada" en el momento del último pago que completó el total

### Validación

Después de ejecutar la migración, valida que todas las facturas pagadas tengan `fecha_hora_pago`:

```sql
-- Verificar que no quedan facturas PAGADAS sin fecha_hora_pago
SELECT COUNT(*)
FROM facturas
WHERE estado = 'PAGADA'
  AND fecha_hora_pago IS NULL;
```

**Resultado esperado**: `0` (cero facturas)

---

## Impacto en Cierres de Caja

### Antes de la Migración

- Facturas pagadas existentes **NO** aparecerán en los cierres de caja porque `fecha_hora_pago` es `NULL`
- Las queries de cierre filtran por `fecha_hora_pago` entre el rango del día

### Después de la Migración

- Todas las facturas pagadas tendrán `fecha_hora_pago` seteada
- Los cierres de caja reflejarán correctamente las ventas **del día en que se pagó**, no del día en que se creó la factura

---

## Ejecución de la Migración

### Opción 1: Directamente en MySQL (Docker)

```bash
# Conectarse al contenedor de MySQL
docker exec -it sailor-db-1 mysql -u sailor -psailor123 sailor

# Ejecutar el SQL de migración
UPDATE facturas f
SET fecha_hora_pago = (
    SELECT MAX(p.fecha_hora)
    FROM pagos p
    WHERE p.factura_id = f.id
)
WHERE f.estado = 'PAGADA'
  AND f.fecha_hora_pago IS NULL;

# Verificar
SELECT COUNT(*) FROM facturas WHERE estado = 'PAGADA' AND fecha_hora_pago IS NULL;

# Salir
exit;
```

### Opción 2: Desde archivo SQL

1. Crear archivo `migration_fecha_hora_pago.sql`:

```sql
USE sailor;

UPDATE facturas f
SET fecha_hora_pago = (
    SELECT MAX(p.fecha_hora)
    FROM pagos p
    WHERE p.factura_id = f.id
)
WHERE f.estado = 'PAGADA'
  AND f.fecha_hora_pago IS NULL;

SELECT 'Migración completada' AS status;
SELECT COUNT(*) AS facturas_sin_fecha_hora_pago
FROM facturas
WHERE estado = 'PAGADA' AND fecha_hora_pago IS NULL;
```

2. Ejecutar:

```bash
docker exec -i sailor-db-1 mysql -u sailor -psailor123 sailor < migration_fecha_hora_pago.sql
```

---

## Comportamiento Post-Migración

### Facturas Nuevas

A partir de ahora, cuando una factura se paga completamente:
1. El campo `estado` cambia a `PAGADA`
2. El campo `fecha_hora_pago` se setea automáticamente a `LocalDateTime.now()`
3. Esta fecha se usa para los cálculos de cierre de caja

### Cálculos de Cierre de Caja

Los totales ahora se calculan basándose en:
- **Pagos del día**: Suma de `pagos.monto` donde `pagos.fecha_hora` está dentro del día
- **Facturas del día**: Count de facturas donde `facturas.fecha_hora_pago` está dentro del día

Esto garantiza consistencia: si una factura se creó ayer pero se pagó hoy, **aparece en el cierre de hoy**.

---

## Rollback (en caso de emergencia)

Si necesitas revertir la migración:

```sql
-- Limpiar fecha_hora_pago
UPDATE facturas
SET fecha_hora_pago = NULL
WHERE estado = 'PAGADA';
```

**Nota**: Esto hará que las facturas pagadas **desaparezcan** de los cierres de caja hasta que ejecutes nuevamente la migración forward.

---

## Checklist de Migración

- [ ] Hacer backup de la base de datos antes de ejecutar
- [ ] Ejecutar el SQL de migración
- [ ] Validar que `SELECT COUNT(*) FROM facturas WHERE estado = 'PAGADA' AND fecha_hora_pago IS NULL;` retorne `0`
- [ ] Reconstruir y reiniciar containers: `docker compose down && docker compose up -d --build`
- [ ] Probar endpoint `GET /cierre-caja/resumen-dia` y verificar que los totales sean correctos
- [ ] Crear un cierre de caja de prueba y validar los montos

---

## Notas Técnicas

- El campo `fecha_hora_pago` es **nullable** por diseño, para permitir facturas en estado `PENDIENTE`
- Es **idempotente**: si ya tiene valor, no se sobreescribe (ver `FacturaService.java:148-150`)
- Hibernate creará automáticamente la columna `fecha_hora_pago` en la tabla `facturas` al iniciar la aplicación (gracias a `ddl-auto: update`)
- La migración de datos es **opcional pero altamente recomendada** para datos históricos correctos
