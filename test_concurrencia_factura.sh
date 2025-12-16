#!/bin/bash

# Test script para validar manejo de concurrencia en creación de facturas

set -e

echo "========================================="
echo "TEST: Concurrencia en Creación de Factura"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login
echo "[1/5] Login..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Get mesa/producto
echo "[2/5] Getting mesa and producto..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Create pedido
echo "[3/5] Creating test pedido..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created${NC}"
echo ""

# Move pedido to ENTREGADO
echo "[4/5] Moving pedido to ENTREGADO..."
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

# TEST: Intentar crear factura 2 veces en paralelo (race condition)
echo "[5/5] TEST: Creando factura 2 veces en paralelo (simular race condition)..."
echo "  Lanzando 2 requests simultáneas..."

# Función para crear factura y guardar resultado
create_factura() {
  local request_id=$1
  local result_file="/tmp/factura_result_${request_id}.txt"

  RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/facturas" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"pedidoId\":$PEDIDO_ID}")

  echo "$RESPONSE" > "$result_file"
}

# Lanzar 2 requests en paralelo
create_factura 1 &
PID1=$!
create_factura 2 &
PID2=$!

# Esperar a que ambas terminen
wait $PID1
wait $PID2

# Leer resultados
RESULT1=$(cat /tmp/factura_result_1.txt)
RESULT2=$(cat /tmp/factura_result_2.txt)

HTTP_CODE1=$(echo "$RESULT1" | tail -1)
HTTP_CODE2=$(echo "$RESULT2" | tail -1)

BODY1=$(echo "$RESULT1" | head -n -1)
BODY2=$(echo "$RESULT2" | head -n -1)

echo ""
echo "  Request 1: HTTP $HTTP_CODE1"
echo "  Request 2: HTTP $HTTP_CODE2"
echo ""

# Validar resultados
CREATED_COUNT=0
CONFLICT_COUNT=0
ERROR_500_COUNT=0

# Analizar Request 1
if [ "$HTTP_CODE1" -eq 201 ] || [ "$HTTP_CODE1" -eq 200 ]; then
  CREATED_COUNT=$((CREATED_COUNT + 1))
  FACTURA_ID=$(echo $BODY1 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✓ Request 1: Factura creada (ID: $FACTURA_ID)${NC}"
elif [ "$HTTP_CODE1" -eq 409 ]; then
  CONFLICT_COUNT=$((CONFLICT_COUNT + 1))
  ERROR_MSG=$(echo $BODY1 | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Request 1: Conflicto detectado correctamente${NC}"
  echo -e "${GREEN}  Mensaje: \"$ERROR_MSG\"${NC}"
elif [ "$HTTP_CODE1" -eq 500 ]; then
  ERROR_500_COUNT=$((ERROR_500_COUNT + 1))
  echo -e "${RED}✗ Request 1: Error 500 (no debería ocurrir)${NC}"
  echo "  Body: $BODY1"
else
  echo -e "${RED}✗ Request 1: HTTP code inesperado: $HTTP_CODE1${NC}"
  echo "  Body: $BODY1"
fi

# Analizar Request 2
if [ "$HTTP_CODE2" -eq 201 ] || [ "$HTTP_CODE2" -eq 200 ]; then
  CREATED_COUNT=$((CREATED_COUNT + 1))
  FACTURA_ID=$(echo $BODY2 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✓ Request 2: Factura creada (ID: $FACTURA_ID)${NC}"
elif [ "$HTTP_CODE2" -eq 409 ]; then
  CONFLICT_COUNT=$((CONFLICT_COUNT + 1))
  ERROR_MSG=$(echo $BODY2 | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Request 2: Conflicto detectado correctamente${NC}"
  echo -e "${GREEN}  Mensaje: \"$ERROR_MSG\"${NC}"
elif [ "$HTTP_CODE2" -eq 500 ]; then
  ERROR_500_COUNT=$((ERROR_500_COUNT + 1))
  echo -e "${RED}✗ Request 2: Error 500 (no debería ocurrir)${NC}"
  echo "  Body: $BODY2"
else
  echo -e "${RED}✗ Request 2: HTTP code inesperado: $HTTP_CODE2${NC}"
  echo "  Body: $BODY2"
fi

echo ""

# Validaciones finales
FAIL=0

# Debe haber exactamente 1 factura creada
if [ "$CREATED_COUNT" -ne 1 ]; then
  echo -e "${RED}✗ FALLO: Se esperaba 1 factura creada, pero se crearon $CREATED_COUNT${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ Exactamente 1 factura creada${NC}"
fi

# Debe haber exactamente 1 conflicto
if [ "$CONFLICT_COUNT" -ne 1 ]; then
  echo -e "${RED}✗ FALLO: Se esperaba 1 conflicto (409), pero hubo $CONFLICT_COUNT${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ Exactamente 1 conflicto (409) detectado${NC}"
fi

# NO debe haber errores 500
if [ "$ERROR_500_COUNT" -gt 0 ]; then
  echo -e "${RED}✗ FALLO CRÍTICO: Se detectaron $ERROR_500_COUNT errores 500 (no manejados)${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ Sin errores 500 (todos manejados correctamente)${NC}"
fi

# Cleanup
rm -f /tmp/factura_result_1.txt /tmp/factura_result_2.txt

echo ""

if [ "$FAIL" -eq 1 ]; then
  echo "========================================="
  echo -e "${RED}✗ TEST FAILED${NC}"
  echo "========================================="
  exit 1
fi

echo "========================================="
echo -e "${GREEN}✓ TEST PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ 1 request creó la factura (201/200)"
echo "  ✓ 1 request recibió conflicto (409)"
echo "  ✓ Sin errores 500 (race condition manejada correctamente)"
echo ""
echo "✓ Manejo de concurrencia funciona correctamente!"
