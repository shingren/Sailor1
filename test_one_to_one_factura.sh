#!/bin/bash

# Test script for One-to-One Factura ↔ Pedido relationship validation
# This validates that the system prevents creating duplicate facturas for the same pedido

set -e  # Exit on error

echo "========================================="
echo "VALIDATION TEST: One-to-One Factura-Pedido"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="https://localhost/api"
TOKEN=""

# Step 1: Login
echo "[1/7] Logging in as admin..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Login successful${NC}"
echo ""

# Step 2: Get or create a mesa
echo "[2/7] Getting mesa ID..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$MESA_ID" ]; then
  echo "  Creating new mesa..."
  MESA_RESPONSE=$(curl -k -s -X POST "$API_BASE/mesas" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"numero":"TEST-1","capacidad":4,"estado":"DISPONIBLE"}')
  MESA_ID=$(echo $MESA_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
fi

echo -e "${GREEN}✓ Using Mesa ID: $MESA_ID${NC}"
echo ""

# Step 3: Get or create a producto
echo "[3/7] Getting producto ID..."
PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PRODUCTO_ID" ]; then
  echo "  Creating new producto..."
  PRODUCTO_RESPONSE=$(curl -k -s -X POST "$API_BASE/productos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Test Product","descripcion":"For testing","precio":10.0,"categoria":"TEST","disponible":true}')
  PRODUCTO_ID=$(echo $PRODUCTO_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
fi

echo -e "${GREEN}✓ Using Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Step 4: Create a pedido
echo "[4/7] Creating test pedido..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":2}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PEDIDO_ID" ]; then
  echo -e "${RED}✗ Failed to create pedido${NC}"
  echo "Response: $PEDIDO_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Created Pedido ID: $PEDIDO_ID${NC}"
echo ""

# Step 5: Update pedido estado to ENTREGADO
echo "[5/7] Updating pedido estado to ENTREGADO..."

# Debug: Check current estado
CURRENT=$(curl -k -s -X GET "$API_BASE/pedidos/$PEDIDO_ID" -H "Authorization: Bearer $TOKEN")
echo "  Current estado: $(echo $CURRENT | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)"

# PENDIENTE → PREPARACION
echo "  Updating to PREPARACION..."
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"PREPARACION"}' > /dev/null

# PREPARACION → LISTO
echo "  Updating to LISTO..."
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"LISTO"}' > /dev/null

# LISTO → ENTREGADO
echo "  Updating to ENTREGADO..."
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"ENTREGADO"}' > /dev/null

# Verify final estado
FINAL_CHECK=$(curl -k -s -X GET "$API_BASE/pedidos/$PEDIDO_ID" -H "Authorization: Bearer $TOKEN")
FINAL_ESTADO=$(echo $FINAL_CHECK | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)
echo "  Final estado: $FINAL_ESTADO"

if [ "$FINAL_ESTADO" != "ENTREGADO" ]; then
  echo -e "${RED}✗ Failed to update estado to ENTREGADO (got: $FINAL_ESTADO)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Pedido estado updated to ENTREGADO${NC}"
echo ""

# Step 6: Create factura (should succeed)
echo "[6/7] Creating factura for pedido #$PEDIDO_ID (should succeed)..."
FACTURA_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

HTTP_CODE=$(echo "$FACTURA_RESPONSE" | tail -1)
FACTURA_BODY=$(echo "$FACTURA_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  FACTURA_ID=$(echo $FACTURA_BODY | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✓ First factura created successfully (ID: $FACTURA_ID)${NC}"
else
  echo -e "${RED}✗ Failed to create first factura (HTTP $HTTP_CODE)${NC}"
  echo "Response: $FACTURA_BODY"
  exit 1
fi
echo ""

# Step 7: Attempt to create duplicate factura (should fail with 409)
echo "[7/7] Attempting to create duplicate factura (should fail with HTTP 409)..."
DUPLICATE_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

HTTP_CODE_DUP=$(echo "$DUPLICATE_RESPONSE" | tail -1)
DUPLICATE_BODY=$(echo "$DUPLICATE_RESPONSE" | head -n -1)

if [ "$HTTP_CODE_DUP" -eq 409 ]; then
  ERROR_MSG=$(echo $DUPLICATE_BODY | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Duplicate factura correctly rejected with HTTP 409${NC}"
  echo -e "${GREEN}  Error message: \"$ERROR_MSG\"${NC}"
else
  echo -e "${RED}✗ Expected HTTP 409 but got HTTP $HTTP_CODE_DUP${NC}"
  echo "Response: $DUPLICATE_BODY"
  exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ ALL VALIDATION TESTS PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  - Created pedido #$PEDIDO_ID in estado ENTREGADO"
echo "  - First factura created successfully (ID: $FACTURA_ID)"
echo "  - Duplicate factura attempt correctly rejected with HTTP 409"
echo "  - Error message displayed: \"$ERROR_MSG\""
echo ""
echo "✓ One-to-One Factura ↔ Pedido relationship is working correctly!"
