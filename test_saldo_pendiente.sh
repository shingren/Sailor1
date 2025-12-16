#!/bin/bash

# Test script para validar cálculo de saldo pendiente end-to-end

set -e

echo "========================================="
echo "TEST: Saldo Pendiente End-to-End"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login
echo "[1/7] Login..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Get mesa/producto
echo "[2/7] Getting mesa and producto..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Create pedido
echo "[3/7] Creating test pedido..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created${NC}"
echo ""

# Move pedido to ENTREGADO
echo "[4/7] Moving pedido to ENTREGADO..."
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
echo "[5/7] Creating factura..."
FACTURA_RESPONSE=$(curl -k -s -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | grep -o '"total":[0-9.]*' | cut -d':' -f2)
TOTAL_PAGADO=$(echo $FACTURA_RESPONSE | grep -o '"totalPagado":[0-9.]*' | cut -d':' -f2)
SALDO_PENDIENTE=$(echo $FACTURA_RESPONSE | grep -o '"saldoPendiente":[0-9.]*' | cut -d':' -f2)

echo -e "${GREEN}✓ Factura #$FACTURA_ID created${NC}"
echo "  Total: \$$FACTURA_TOTAL"
echo "  Total Pagado: \$$TOTAL_PAGADO"
echo "  Saldo Pendiente: \$$SALDO_PENDIENTE"
echo ""

# TEST CASE 1: Factura sin pagos
echo "[TEST 1/3] Validando factura sin pagos..."

if [ "$TOTAL_PAGADO" != "0.0" ]; then
  echo -e "${RED}✗ Expected totalPagado=0.0 but got $TOTAL_PAGADO${NC}"
  exit 1
fi

if [ "$SALDO_PENDIENTE" != "$FACTURA_TOTAL" ]; then
  echo -e "${RED}✗ Expected saldoPendiente=$FACTURA_TOTAL but got $SALDO_PENDIENTE${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Factura sin pagos: totalPagado=0, saldoPendiente=total${NC}"
echo ""

# TEST CASE 2: Pago parcial
echo "[6/7] TEST CASE 2: Registrando pago parcial..."
MONTO_PARCIAL=5000
echo "  Pagando monto parcial: \$$MONTO_PARCIAL"

PAGO_PARCIAL_RESPONSE=$(curl -k -s -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$MONTO_PARCIAL,\"metodo\":\"EFECTIVO\"}")

TOTAL_PAGADO_PARCIAL=$(echo $PAGO_PARCIAL_RESPONSE | grep -o '"totalPagado":[0-9.]*' | cut -d':' -f2)
SALDO_PENDIENTE_PARCIAL=$(echo $PAGO_PARCIAL_RESPONSE | grep -o '"saldoPendiente":[0-9.]*' | cut -d':' -f2)
ESTADO_PARCIAL=$(echo $PAGO_PARCIAL_RESPONSE | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

echo "  Total Pagado: \$$TOTAL_PAGADO_PARCIAL"
echo "  Saldo Pendiente: \$$SALDO_PENDIENTE_PARCIAL"
echo "  Estado: $ESTADO_PARCIAL"
echo ""

if [ "$TOTAL_PAGADO_PARCIAL" != "$MONTO_PARCIAL.0" ]; then
  echo -e "${RED}✗ Expected totalPagado=$MONTO_PARCIAL.0 but got $TOTAL_PAGADO_PARCIAL${NC}"
  exit 1
fi

# Calculate expected saldo (note: using integer arithmetic for simple validation)
SALDO_ESPERADO=$(printf "%.1f" "$(echo "$FACTURA_TOTAL - $MONTO_PARCIAL" | awk '{print $1 - $3}')")
SALDO_PENDIENTE_NUM=$(printf "%.1f" "$SALDO_PENDIENTE_PARCIAL")

if [ "$SALDO_PENDIENTE_NUM" != "$SALDO_ESPERADO" ]; then
  echo -e "${RED}✗ Expected saldoPendiente=$SALDO_ESPERADO but got $SALDO_PENDIENTE_NUM${NC}"
  exit 1
fi

if [ "$ESTADO_PARCIAL" != "PENDIENTE" ]; then
  echo -e "${RED}✗ Expected estado=PENDIENTE but got $ESTADO_PARCIAL${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Pago parcial: totalPagado aumentó, saldoPendiente disminuyó correctamente${NC}"
echo ""

# TEST CASE 3: Pago final
echo "[7/7] TEST CASE 3: Registrando pago final..."
MONTO_FINAL=$SALDO_PENDIENTE_PARCIAL
echo "  Pagando saldo restante: \$$MONTO_FINAL"

PAGO_FINAL_RESPONSE=$(curl -k -s -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$MONTO_FINAL,\"metodo\":\"TARJETA\"}")

TOTAL_PAGADO_FINAL=$(echo $PAGO_FINAL_RESPONSE | grep -o '"totalPagado":[0-9.]*' | cut -d':' -f2)
SALDO_PENDIENTE_FINAL=$(echo $PAGO_FINAL_RESPONSE | grep -o '"saldoPendiente":[0-9.]*' | cut -d':' -f2)
ESTADO_FINAL=$(echo $PAGO_FINAL_RESPONSE | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

echo "  Total Pagado: \$$TOTAL_PAGADO_FINAL"
echo "  Saldo Pendiente: \$$SALDO_PENDIENTE_FINAL"
echo "  Estado: $ESTADO_FINAL"
echo ""

if [ "$SALDO_PENDIENTE_FINAL" != "0.0" ]; then
  echo -e "${RED}✗ Expected saldoPendiente=0.0 but got $SALDO_PENDIENTE_FINAL${NC}"
  exit 1
fi

TOTAL_PAGADO_FINAL_NUM=$(printf "%.1f" "$TOTAL_PAGADO_FINAL")
FACTURA_TOTAL_NUM=$(printf "%.1f" "$FACTURA_TOTAL")

if [ "$TOTAL_PAGADO_FINAL_NUM" != "$FACTURA_TOTAL_NUM" ]; then
  echo -e "${RED}✗ Expected totalPagado=$FACTURA_TOTAL_NUM but got $TOTAL_PAGADO_FINAL_NUM${NC}"
  exit 1
fi

if [ "$ESTADO_FINAL" != "PAGADA" ]; then
  echo -e "${RED}✗ Expected estado=PAGADA but got $ESTADO_FINAL${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Pago final: saldoPendiente=0, estado=PAGADA${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Factura sin pagos: totalPagado=0, saldoPendiente=total"
echo "  ✓ Pago parcial: totalPagado aumenta, saldoPendiente disminuye"
echo "  ✓ Pago final: saldoPendiente=0, estado=PAGADA"
echo ""
echo "✓ Cálculo de saldo pendiente end-to-end funciona correctamente!"
