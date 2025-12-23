#!/bin/bash

# test_flujo_sin_entregado_roles.sh
# Test script for new pedido flow without ENTREGADO state and with RBAC controls

set -e  # Exit on error

echo "========================================"
echo "TEST: Flujo sin ENTREGADO con RBAC"
echo "========================================"

BASE_URL="http://localhost:8080"

# Login as admin to create test users
echo ""
echo "[Setup] Login as admin..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
echo "✓ Admin login successful"

# Create MESERO user if doesn't exist
echo ""
echo "[Setup] Creating MESERO user..."
curl -s -X POST "$BASE_URL/usuarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email":"mesero@sailor.com","nombre":"Mesero Test","password":"mesero123","rol":"MESERO"}' > /dev/null 2>&1 || echo "  (User may already exist)"

# Create COCINA user if doesn't exist
echo ""
echo "[Setup] Creating COCINA user..."
curl -s -X POST "$BASE_URL/usuarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email":"cocina@sailor.com","nombre":"Cocina Test","password":"cocina123","rol":"COCINA"}' > /dev/null 2>&1 || echo "  (User may already exist)"

# Create CAJA user if doesn't exist
echo ""
echo "[Setup] Creating CAJA user..."
curl -s -X POST "$BASE_URL/usuarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email":"caja@sailor.com","nombre":"Caja Test","password":"caja123","rol":"CAJA"}' > /dev/null 2>&1 || echo "  (User may already exist)"
echo "✓ Test users ready"

# Login as MESERO
echo ""
echo "[1/10] Login as MESERO..."
MESERO_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"mesero@sailor.com","password":"mesero123"}')
MESERO_TOKEN=$(echo $MESERO_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
MESERO_ROL=$(echo $MESERO_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['rol'])")
echo "✓ MESERO login successful (rol: $MESERO_ROL)"

# Login as COCINA
echo ""
echo "[2/10] Login as COCINA..."
COCINA_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"cocina@sailor.com","password":"cocina123"}')
COCINA_TOKEN=$(echo $COCINA_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
COCINA_ROL=$(echo $COCINA_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['rol'])")
echo "✓ COCINA login successful (rol: $COCINA_ROL)"

# Login as CAJA
echo ""
echo "[Setup] Login as CAJA..."
CAJA_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"caja@sailor.com","password":"caja123"}')
CAJA_TOKEN=$(echo $CAJA_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
echo "✓ CAJA login successful"

# Create test mesa (as ADMIN, since MESERO can create mesas per SecurityConfig)
echo ""
echo "[Setup] Create test mesa..."
curl -s -X POST "$BASE_URL/mesas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"codigo":"Mesa Test","capacidad":4,"estado":"disponible"}' > /dev/null || echo "  (Mesa may already exist)"

MESA_ID=$(curl -s -X GET "$BASE_URL/mesas" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -c "import sys, json; mesas = json.load(sys.stdin); print(next((m['id'] for m in mesas if m['codigo'] == 'Mesa Test'), None))")
echo "✓ Mesa Test ready (ID: $MESA_ID)"

# Create test product (as ADMIN)
echo ""
echo "[Setup] Create test product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/productos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"nombre":"Plato Test","categoria":"Test","precio":100.00,"disponible":true}')
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
  PRODUCT_ID=$(curl -s -X GET "$BASE_URL/productos" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    | python3 -c "import sys, json; products = json.load(sys.stdin); print(next((p['id'] for p in products if p['nombre'] == 'Plato Test'), None))")
fi
echo "✓ Plato Test ready (ID: $PRODUCT_ID)"

# TEST 1: MESERO creates pedido → should be PENDIENTE
echo ""
echo "[3/10] MESERO creates pedido..."
PEDIDO_RESPONSE=$(curl -s -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MESERO_TOKEN" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCT_ID,\"cantidad\":2}],\"observaciones\":\"Test RBAC\"}")
PEDIDO_ID=$(echo $PEDIDO_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
PEDIDO_ESTADO=$(echo $PEDIDO_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")
echo "✓ Pedido created: ID=$PEDIDO_ID, Estado=$PEDIDO_ESTADO"

if [ "$PEDIDO_ESTADO" != "PENDIENTE" ]; then
  echo "✗ VALIDATION FAILED: Expected estado PENDIENTE, got $PEDIDO_ESTADO"
  exit 1
fi
echo "✓ VALIDATION PASSED: Pedido created in PENDIENTE state"

# TEST 2: MESERO tries to mark as LISTO → should fail with 403
echo ""
echo "[4/10] MESERO tries to mark as LISTO (should fail)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/pedidos/$PEDIDO_ID/marcar-listo" \
  -H "Authorization: Bearer $MESERO_TOKEN")

if [ "$HTTP_CODE" = "403" ]; then
  echo "✓ VALIDATION PASSED: MESERO blocked from marking LISTO (HTTP 403)"
else
  echo "✗ VALIDATION FAILED: MESERO should not be able to mark LISTO (got HTTP $HTTP_CODE instead of 403)"
  exit 1
fi

# TEST 3: COCINA marks as PREPARACION
echo ""
echo "[5/10] COCINA marks pedido as PREPARACION..."
PREP_RESPONSE=$(curl -s -X POST "$BASE_URL/pedidos/$PEDIDO_ID/iniciar-preparacion" \
  -H "Authorization: Bearer $COCINA_TOKEN")
PREP_ESTADO=$(echo $PREP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")
echo "  Estado after COCINA action: $PREP_ESTADO"

if [ "$PREP_ESTADO" != "PREPARACION" ]; then
  echo "✗ VALIDATION FAILED: Expected PREPARACION, got $PREP_ESTADO"
  exit 1
fi
echo "✓ VALIDATION PASSED: COCINA successfully marked pedido as PREPARACION"

# TEST 4: COCINA marks as LISTO
echo ""
echo "[6/10] COCINA marks pedido as LISTO..."
LISTO_RESPONSE=$(curl -s -X POST "$BASE_URL/pedidos/$PEDIDO_ID/marcar-listo" \
  -H "Authorization: Bearer $COCINA_TOKEN")
LISTO_ESTADO=$(echo $LISTO_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")
echo "  Estado after COCINA action: $LISTO_ESTADO"

if [ "$LISTO_ESTADO" != "LISTO" ]; then
  echo "✗ VALIDATION FAILED: Expected LISTO, got $LISTO_ESTADO"
  exit 1
fi
echo "✓ VALIDATION PASSED: COCINA successfully marked pedido as LISTO"

# TEST 5: Verify pedido appears in listos-facturar
echo ""
echo "[7/10] Verify pedido appears in listos-facturar..."
LISTOS_RESPONSE=$(curl -s -X GET "$BASE_URL/pedidos/listos-facturar" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PEDIDO_IN_LISTOS=$(echo $LISTOS_RESPONSE | python3 -c "import sys, json; pedidos = json.load(sys.stdin); print(any(p['id'] == $PEDIDO_ID for p in pedidos))")

if [ "$PEDIDO_IN_LISTOS" = "True" ]; then
  echo "✓ VALIDATION PASSED: Pedido appears in listos-facturar"
else
  echo "✗ VALIDATION FAILED: Pedido $PEDIDO_ID NOT in listos-facturar"
  echo "Response: $LISTOS_RESPONSE"
  exit 1
fi

# TEST 6: Get cuenta and verify it appears in cuentas/listas-facturar
echo ""
echo "[8/10] Verify cuenta appears in cuentas/listas-facturar..."
CUENTAS_ABIERTAS=$(curl -s -X GET "$BASE_URL/cuentas/abiertas" \
  -H "Authorization: Bearer $CAJA_TOKEN")
CUENTA_ID=$(echo $CUENTAS_ABIERTAS | python3 -c "import sys, json; cuentas = json.load(sys.stdin); print(next((c['id'] for c in cuentas if c['mesaId'] == $MESA_ID), None))")
echo "  Cuenta ID: $CUENTA_ID"

CUENTAS_LISTAS=$(curl -s -X GET "$BASE_URL/cuentas/listas-facturar" \
  -H "Authorization: Bearer $CAJA_TOKEN")
CUENTA_EN_LISTA=$(echo $CUENTAS_LISTAS | python3 -c "import sys, json; cuentas = json.load(sys.stdin); print(any(c['id'] == $CUENTA_ID for c in cuentas))" 2>/dev/null || echo "False")

if [ "$CUENTA_EN_LISTA" = "True" ]; then
  echo "✓ VALIDATION PASSED: Cuenta appears in listas-facturar"
else
  echo "✗ VALIDATION FAILED: Cuenta $CUENTA_ID NOT in listas-facturar"
  echo "Response: $CUENTAS_LISTAS"
  exit 1
fi

# TEST 7: CAJA generates factura from cuenta
echo ""
echo "[9/10] CAJA generates factura from cuenta..."
FACTURA_RESPONSE=$(curl -s -X POST "$BASE_URL/facturas/cuenta/$CUENTA_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAJA_TOKEN" \
  -d '{"esConsumidorFinal":true}')
FACTURA_ID=$(echo $FACTURA_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
echo "✓ Factura created: ID=$FACTURA_ID, Total=$FACTURA_TOTAL"

# TEST 8: CAJA registers payment
echo ""
echo "[10/10] CAJA registers payment..."
PAGO_RESPONSE=$(curl -s -X POST "$BASE_URL/pagos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAJA_TOKEN" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")
echo "✓ Payment registered"

# Final validation: Check pedido estado is PAGADO
PEDIDO_FINAL=$(curl -s -X GET "$BASE_URL/pedidos/$PEDIDO_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PEDIDO_FINAL_ESTADO=$(echo $PEDIDO_FINAL | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")

if [ "$PEDIDO_FINAL_ESTADO" = "PAGADO" ]; then
  echo "✓ VALIDATION PASSED: Pedido marked as PAGADO after full payment"
else
  echo "✗ VALIDATION FAILED: Expected PAGADO, got $PEDIDO_FINAL_ESTADO"
  exit 1
fi

echo ""
echo "========================================"
echo "✓ ALL TESTS PASSED!"
echo "========================================"
echo "Summary:"
echo "- MESERO created pedido → PENDIENTE"
echo "- MESERO blocked from marking LISTO (403)"
echo "- COCINA marked PREPARACION → OK"
echo "- COCINA marked LISTO → OK"
echo "- Pedido appeared in listos-facturar"
echo "- Cuenta appeared in listas-facturar"
echo "- CAJA generated factura and payment → pedido PAGADO"
echo "========================================"
