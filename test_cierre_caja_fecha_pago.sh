#!/bin/bash

# Test script para validar que cierre de caja se calcula por fecha de PAGO, no por fecha de creación de factura

set -e

echo "========================================="
echo "TEST: Cierre de Caja por Fecha de Pago"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login
echo "[1/8] Login..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Get mesa/producto
echo "[2/8] Getting mesa and producto..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Create pedido
echo "[3/8] Creating test pedido..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created${NC}"
echo ""

# Move pedido to ENTREGADO
echo "[4/8] Moving pedido to ENTREGADO..."
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"PREPARACION"}' > /dev/null

curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"LISTO"}' > /dev/null

curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"ENTREGADO"}' > /dev/null

echo -e "${GREEN}✓ Pedido estado: ENTREGADO${NC}"
echo ""

# Create factura
echo "[5/8] Creating factura..."
FACTURA_RESPONSE=$(curl -k -s -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | grep -o '"total":[0-9.]*' | cut -d':' -f2)

echo -e "${GREEN}✓ Factura #$FACTURA_ID created (Total: \$$FACTURA_TOTAL)${NC}"
echo ""

# CRITICAL: Cambiar fecha_hora de la factura a "ayer" vía SQL (simular factura creada ayer)
echo "[6/8] TEST SETUP: Modificando fecha de factura a 'ayer' vía SQL..."
YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
YESTERDAY_TIMESTAMP="${YESTERDAY} 10:00:00"

docker exec sailor-db-1 mysql -u sailor -psailor123 -e \
  "UPDATE sailor.facturas SET fecha_hora = '${YESTERDAY_TIMESTAMP}' WHERE id = $FACTURA_ID;" > /dev/null 2>&1

echo -e "${YELLOW}⚠ Factura #$FACTURA_ID fecha_hora cambiada a: $YESTERDAY_TIMESTAMP (ayer)${NC}"
echo ""

# Registrar pago HOY (total)
echo "[7/8] Registrando pago HOY (esto debería aparecer en cierre de HOY)..."
PAGO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")

PAGO_ESTADO=$(echo $PAGO_RESPONSE | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Pago registrado HOY. Estado factura: $PAGO_ESTADO${NC}"
echo ""

# Validar resumen del día HOY
echo "[8/8] TEST: Validando resumen del día de HOY..."
RESUMEN_RESPONSE=$(curl -k -s -X GET "$API_BASE/cierre-caja/resumen-dia" \
  -H "Authorization: Bearer $TOKEN")

echo "Resumen del día:"
echo "$RESUMEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESUMEN_RESPONSE"
echo ""

# Extraer valores del resumen
TOTAL_EFECTIVO=$(echo $RESUMEN_RESPONSE | grep -o '"totalEfectivo":[0-9.]*' | cut -d':' -f2)
TOTAL_VENTAS_DIA=$(echo $RESUMEN_RESPONSE | grep -o '"totalVentasDia":[0-9.]*' | cut -d':' -f2)
CANTIDAD_FACTURAS=$(echo $RESUMEN_RESPONSE | grep -o '"cantidadFacturas":[0-9]*' | cut -d':' -f2)

echo "Valores extraídos:"
echo "  Total Efectivo: \$$TOTAL_EFECTIVO"
echo "  Total Ventas Día: \$$TOTAL_VENTAS_DIA"
echo "  Cantidad Facturas: $CANTIDAD_FACTURAS"
echo ""

# Validaciones
FAIL=0

# Validación 1: totalEfectivo debe incluir el pago de hoy
if [ -z "$TOTAL_EFECTIVO" ] || [ "$TOTAL_EFECTIVO" == "0.0" ]; then
  echo -e "${RED}✗ FALLO: totalEfectivo es $TOTAL_EFECTIVO, pero se esperaba >= \$$FACTURA_TOTAL${NC}"
  echo -e "${RED}  Esto significa que el pago de HOY NO está siendo contado en el cierre.${NC}"
  FAIL=1
else
  # Convertir a enteros para comparación (quitando decimales)
  TOTAL_EFECTIVO_INT=$(echo $TOTAL_EFECTIVO | cut -d'.' -f1)
  FACTURA_TOTAL_INT=$(echo $FACTURA_TOTAL | cut -d'.' -f1)

  if [ "$TOTAL_EFECTIVO_INT" -ge "$FACTURA_TOTAL_INT" ]; then
    echo -e "${GREEN}✓ totalEfectivo (\$$TOTAL_EFECTIVO) incluye el pago de hoy${NC}"
  else
    echo -e "${RED}✗ FALLO: totalEfectivo (\$$TOTAL_EFECTIVO) < \$$FACTURA_TOTAL${NC}"
    FAIL=1
  fi
fi

# Validación 2: cantidadFacturas debe ser >= 1 (incluye la factura pagada hoy)
if [ -z "$CANTIDAD_FACTURAS" ] || [ "$CANTIDAD_FACTURAS" -lt 1 ]; then
  echo -e "${RED}✗ FALLO: cantidadFacturas es $CANTIDAD_FACTURAS, se esperaba >= 1${NC}"
  echo -e "${RED}  Esto significa que la factura pagada HOY NO está siendo contada.${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ cantidadFacturas ($CANTIDAD_FACTURAS) >= 1 (incluye factura pagada hoy)${NC}"
fi

# Validación 3: totalVentasDia debe ser >= factura total
if [ -z "$TOTAL_VENTAS_DIA" ] || [ "$TOTAL_VENTAS_DIA" == "0.0" ]; then
  echo -e "${RED}✗ FALLO: totalVentasDia es $TOTAL_VENTAS_DIA, se esperaba >= \$$FACTURA_TOTAL${NC}"
  FAIL=1
else
  TOTAL_VENTAS_INT=$(echo $TOTAL_VENTAS_DIA | cut -d'.' -f1)
  if [ "$TOTAL_VENTAS_INT" -ge "$FACTURA_TOTAL_INT" ]; then
    echo -e "${GREEN}✓ totalVentasDia (\$$TOTAL_VENTAS_DIA) incluye el pago de hoy${NC}"
  else
    echo -e "${RED}✗ FALLO: totalVentasDia (\$$TOTAL_VENTAS_DIA) < \$$FACTURA_TOTAL${NC}"
    FAIL=1
  fi
fi

echo ""

if [ "$FAIL" -eq 1 ]; then
  echo "========================================="
  echo -e "${RED}✗ TEST FAILED${NC}"
  echo "========================================="
  echo ""
  echo "El cierre de caja NO está usando la fecha de pago correctamente."
  echo "Detalles del problema:"
  echo "  - Factura creada: AYER ($YESTERDAY_TIMESTAMP)"
  echo "  - Pago registrado: HOY"
  echo "  - El resumen del día de HOY debería incluir:"
  echo "    * El monto del pago en totalEfectivo"
  echo "    * La factura en cantidadFacturas"
  echo ""
  exit 1
fi

echo "========================================="
echo -e "${GREEN}✓ TEST PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Factura creada AYER pero pagada HOY"
echo "  ✓ El pago de HOY aparece en totalEfectivo del cierre de HOY"
echo "  ✓ La factura pagada HOY se cuenta en cantidadFacturas de HOY"
echo "  ✓ El cálculo se basa en fecha de PAGO, no en fecha de creación"
echo ""
echo "✓ Cierre de caja funciona correctamente con fecha de pago!"
