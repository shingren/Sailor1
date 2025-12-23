# Migración: Eliminación del estado ENTREGADO en Pedidos

## Resumen de Cambios

Se ha modificado el flujo de estados de **Pedido** para simplificar el proceso:

**Flujo anterior:**
```
PENDIENTE → PREPARACION → LISTO → ENTREGADO → PAGADO
```

**Nuevo flujo:**
```
PENDIENTE → PREPARACION → LISTO → PAGADO
```

### Cambios principales:

1. **Estado ENTREGADO eliminado** del enum `PedidoEstado`
2. **LISTO** ahora es el estado final antes del pago
3. **COCINA** completa el flujo marcando pedidos como LISTO
4. **MESERO** ya NO puede marcar pedidos como LISTO (solo COCINA y ADMIN)
5. **Inventario** se deduce al marcar LISTO (antes era ENTREGADO)
6. **Facturación** requiere estado LISTO (antes ENTREGADO)

## Migración de Datos

### SQL para migrar pedidos existentes

Si tienes pedidos en estado `ENTREGADO` en tu base de datos, ejecuta este script SQL para migrarlos a `LISTO`:

```sql
-- Actualizar pedidos existentes en estado ENTREGADO a LISTO
UPDATE pedidos
SET estado = 'LISTO'
WHERE estado = 'ENTREGADO';

-- Verificar la migración
SELECT estado, COUNT(*) as cantidad
FROM pedidos
GROUP BY estado;
```

**Nota:** Este script debe ejecutarse **antes** de levantar el backend con el nuevo código, ya que el enum `ENTREGADO` ya no existirá.

### Pasos para migración en producción:

1. **Hacer backup de la base de datos**
   ```bash
   docker exec sailor-db-1 mysqldump -u sailor -psailor123 sailor > backup_pre_migration.sql
   ```

2. **Detener los servicios**
   ```bash
   docker compose down
   ```

3. **Ejecutar el script SQL**
   ```bash
   docker compose up -d db
   docker exec -i sailor-db-1 mysql -u sailor -psailor123 sailor <<EOF
   UPDATE pedidos SET estado = 'LISTO' WHERE estado = 'ENTREGADO';
   SELECT 'Migration completed. Current estado counts:' as status;
   SELECT estado, COUNT(*) as cantidad FROM pedidos GROUP BY estado;
   EOF
   ```

4. **Levantar todos los servicios con el nuevo código**
   ```bash
   docker compose up -d --build
   ```

5. **Verificar funcionamiento**
   ```bash
   bash test_flujo_sin_entregado_roles.sh
   ```

## Cambios de API

### Nuevos endpoints

Se agregaron endpoints específicos para transiciones de estado (solo COCINA y ADMIN):

- **POST** `/pedidos/{id}/iniciar-preparacion`
  - Cambia de PENDIENTE → PREPARACION
  - Roles: COCINA, ADMIN

- **POST** `/pedidos/{id}/marcar-listo`
  - Cambia de PREPARACION → LISTO
  - Roles: COCINA, ADMIN

### Endpoints modificados

- **PATCH** `/pedidos/{id}/estado`
  - **Restringido solo a ADMIN** (antes: ADMIN, MESERO, COCINA)
  - Se recomienda usar los endpoints específicos en su lugar

### Validaciones actualizadas

- **GET** `/pedidos/listos-facturar`: Ahora retorna pedidos con estado `LISTO` (antes `ENTREGADO`)
- **GET** `/cuentas/listas-facturar`: Retorna cuentas donde todos los pedidos están `LISTO` o `PAGADO`
- **POST** `/facturas` (pedido individual): Requiere pedido en estado `LISTO`
- **POST** `/facturas/cuenta/{id}`: Requiere todos los pedidos de la cuenta en estado `LISTO`

## Impacto en el Frontend

### Cambios necesarios en UI:

1. **Eliminar botones/opciones de "Marcar como Entregado"**
2. **Actualizar pantalla de Cocina:**
   - Mostrar botón "Iniciar Preparación" (PENDIENTE → PREPARACION)
   - Mostrar botón "Marcar Listo" (PREPARACION → LISTO)
3. **Ocultar controles de estado LISTO para rol MESERO**
4. **Actualizar filtros y contadores:**
   - "Pedidos Activos" = estados PENDIENTE, PREPARACION (antes incluía LISTO y ENTREGADO)
   - "Listos para Facturar" = estado LISTO (antes ENTREGADO)

### Ejemplo de código frontend (React):

```javascript
// Antes
const marcarEntregado = async (pedidoId) => {
  await fetch(`/api/pedidos/${pedidoId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify({ estado: 'ENTREGADO' })
  });
};

// Después (solo para COCINA)
const marcarListo = async (pedidoId) => {
  await fetch(`/api/pedidos/${pedidoId}/marcar-listo`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader()
    }
  });
};
```

## Testing

Ejecutar el test end-to-end para validar:

```bash
bash test_flujo_sin_entregado_roles.sh
```

Este test valida:
- ✓ Mesero puede crear pedidos
- ✓ Mesero NO puede marcar como LISTO (debe fallar con 403)
- ✓ Cocina puede iniciar preparación
- ✓ Cocina puede marcar como LISTO
- ✓ Inventario se deduce al marcar LISTO
- ✓ Cuentas listas para facturar usan estado LISTO
- ✓ Generación de factura y pago funciona correctamente

## Rollback (en caso de problemas)

Si necesitas revertir los cambios:

1. **Restaurar backup de base de datos:**
   ```bash
   docker compose down
   docker volume rm sailor_mysql_data
   docker compose up -d db
   # Esperar a que MySQL esté listo
   sleep 30
   docker exec -i sailor-db-1 mysql -u sailor -psailor123 sailor < backup_pre_migration.sql
   ```

2. **Volver al código anterior:**
   ```bash
   git revert <commit_hash_de_esta_migracion>
   docker compose up -d --build
   ```

## Preguntas Frecuentes

**P: ¿Qué pasa con los pedidos que ya están PAGADOS?**
R: No se ven afectados. El estado PAGADO se mantiene igual.

**P: ¿Cómo afecta esto al inventario?**
R: El inventario ahora se deduce cuando el pedido llega a LISTO (antes era ENTREGADO). El comportamiento es el mismo, solo cambia el momento en que se ejecuta.

**P: ¿Los meseros pueden ver el estado LISTO?**
R: Sí, pueden ver pedidos en estado LISTO, pero no pueden cambiarlos a ese estado. Solo COCINA puede marcar pedidos como LISTO.

**P: ¿Qué pasa si un pedido queda en PREPARACION y nunca se marca LISTO?**
R: El pedido quedará en "Pedidos Activos" y no aparecerá en "Listos para Facturar". La cocina debe marcarlo como LISTO para que pueda facturarse.
