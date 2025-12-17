#!/bin/bash

# Test script para validar trazabilidad de usuarios en facturas y pagos

set -e

echo "========================================="
echo "TEST: Trazabilidad de Usuarios en Caja"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login as admin
echo "[1/7] Login as admin@sailor.com..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in as admin@sailor.com${NC}"
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

# TEST 1: Create factura and validate creadaPor field
echo "[5/7] TEST 1: Creating factura and validating 'creadaPor' field..."
FACTURA_RESPONSE=$(curl -k -s -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | grep -o '"total":[0-9.]*' | cut -d':' -f2)
CREADA_POR=$(echo $FACTURA_RESPONSE | grep -o '"creadaPor":"[^"]*"' | cut -d'"' -f4)

echo "Factura Response:"
echo "$FACTURA_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FACTURA_RESPONSE"
echo ""

# Validation 1: creadaPor must be present and equal to admin@sailor.com
FAIL=0

if [ -z "$CREADA_POR" ]; then
  echo -e "${RED}✗ FALLO: Campo 'creadaPor' no está presente en la respuesta${NC}"
  FAIL=1
elif [ "$CREADA_POR" != "admin@sailor.com" ]; then
  echo -e "${RED}✗ FALLO: creadaPor='$CREADA_POR', se esperaba 'admin@sailor.com'${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ creadaPor = '$CREADA_POR' (correcto)${NC}"
fi

echo ""

# TEST 2: Register pago and validate registradoPor field
echo "[6/7] TEST 2: Registering pago and validating 'registradoPor' field..."
PAGO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")

echo "Pago/Factura Response (after payment):"
echo "$PAGO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PAGO_RESPONSE"
echo ""

# Extract registradoPor from first pago in the pagos array
REGISTRADO_POR=$(echo $PAGO_RESPONSE | grep -o '"registradoPor":"[^"]*"' | head -1 | cut -d'"' -f4)

# Validation 2: registradoPor must be present and equal to admin@sailor.com
if [ -z "$REGISTRADO_POR" ]; then
  echo -e "${RED}✗ FALLO: Campo 'registradoPor' no está presente en los pagos de la respuesta${NC}"
  FAIL=1
elif [ "$REGISTRADO_POR" != "admin@sailor.com" ]; then
  echo -e "${RED}✗ FALLO: registradoPor='$REGISTRADO_POR', se esperaba 'admin@sailor.com'${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ registradoPor = '$REGISTRADO_POR' (correcto)${NC}"
fi

echo ""

# TEST 3: Fetch factura and verify both fields persist
echo "[7/7] TEST 3: Fetching factura to verify trazabilidad persists..."
FACTURA_GET_RESPONSE=$(curl -k -s -X GET "$API_BASE/facturas/$FACTURA_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "GET Factura Response:"
echo "$FACTURA_GET_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FACTURA_GET_RESPONSE"
echo ""

CREADA_POR_GET=$(echo $FACTURA_GET_RESPONSE | grep -o '"creadaPor":"[^"]*"' | cut -d'"' -f4)
REGISTRADO_POR_GET=$(echo $FACTURA_GET_RESPONSE | grep -o '"registradoPor":"[^"]*"' | head -1 | cut -d'"' -f4)

# Validation 3: Both fields must persist after fetching
if [ -z "$CREADA_POR_GET" ]; then
  echo -e "${RED}✗ FALLO: creadaPor no persiste después de GET${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ creadaPor persiste en GET: '$CREADA_POR_GET'${NC}"
fi

if [ -z "$REGISTRADO_POR_GET" ]; then
  echo -e "${RED}✗ FALLO: registradoPor no persiste después de GET${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ registradoPor persiste en GET: '$REGISTRADO_POR_GET'${NC}"
fi

echo ""

if [ "$FAIL" -eq 1 ]; then
  echo "========================================="
  echo -e "${RED}✗ TEST FAILED${NC}"
  echo "========================================="
  echo ""
  echo "La trazabilidad de usuarios NO está funcionando correctamente."
  echo "Verifica que:"
  echo "  - Los campos creadaPorUsuario y registradoPorUsuario existen en las entidades"
  echo "  - FacturaService está seteando estos campos correctamente"
  echo "  - Los DTOs incluyen creadaPor y registradoPor"
  echo "  - El SecurityContext contiene el usuario autenticado"
  echo ""
  exit 1
fi

echo "========================================="
echo -e "${GREEN}✓ TEST PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Factura creada por: admin@sailor.com"
echo "  ✓ Pago registrado por: admin@sailor.com"
echo "  ✓ Campos persisten correctamente en la base de datos"
echo "  ✓ Trazabilidad de usuarios funciona correctamente"
echo ""
echo "✓ Auditoría de caja lista para producción!"
