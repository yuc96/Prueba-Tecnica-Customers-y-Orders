# Ejemplos cURL

Base URLs por defecto: Customers `http://localhost:3001`, Orders `http://localhost:3002`, Lambda `http://localhost:3000`.

---

## Customers API

### Health
```bash
curl -s http://localhost:3001/health
```

### Crear cliente
```bash
curl -s -X POST http://localhost:3001/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "ACME Corp", "email": "ops@acme.com", "phone": "+1-555-0100"}'
```

### Obtener cliente por ID
```bash
curl -s http://localhost:3001/customers/1
```

### Listar clientes (búsqueda y paginación)
```bash
# Sin filtros, límite por defecto
curl -s "http://localhost:3001/customers"

# Con búsqueda y límite
curl -s "http://localhost:3001/customers?search=ACME&limit=10"

# Siguiente página (cursor)
curl -s "http://localhost:3001/customers?cursor=2&limit=5"
```

### Actualizar cliente
```bash
curl -s -X PUT http://localhost:3001/customers/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "ACME Corp Updated", "phone": "+1-555-0199"}'
```

### Soft delete cliente
```bash
curl -s -X DELETE http://localhost:3001/customers/1
```

### Obtener cliente (endpoint interno, SERVICE_TOKEN)
```bash
curl -s http://localhost:3001/internal/customers/1 \
  -H "Authorization: Bearer shared-internal-token"
```

---

## Orders API

### Health
```bash
curl -s http://localhost:3002/health
```

### Crear producto
```bash
curl -s -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{"sku": "SKU-001", "name": "Widget A", "price_cents": 9999, "stock": 100}'
```

### Obtener producto
```bash
curl -s http://localhost:3002/products/1
```

### Listar productos
```bash
curl -s "http://localhost:3002/products?search=Widget&limit=10"
```

### Actualizar producto (PATCH)
```bash
curl -s -X PATCH http://localhost:3002/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price_cents": 10999, "stock": 80}'
```

### Crear pedido
```bash
curl -s -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "items": [{"product_id": 2, "qty": 3}]}'
```

### Obtener pedido (con items)
```bash
curl -s http://localhost:3002/orders/1
```

### Listar pedidos
```bash
# Todos
curl -s "http://localhost:3002/orders"

# Por estado
curl -s "http://localhost:3002/orders?status=CREATED"

# Con rango de fechas y cursor
curl -s "http://localhost:3002/orders?status=CONFIRMED&from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z&limit=20"
```

### Confirmar pedido (idempotente)
```bash
curl -s -X POST http://localhost:3002/orders/1/confirm \
  -H "X-Idempotency-Key: abc-123-unique-key"
```

### Cancelar pedido
```bash
curl -s -X POST http://localhost:3002/orders/1/cancel
```

---

## Lambda Orquestador (create-and-confirm-order)

Crea el pedido y lo confirma en una sola llamada. Requiere que Customers API y Orders API estén levantados.

```bash
curl -s -X POST http://localhost:3000/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [{"product_id": 2, "qty": 3}],
    "idempotency_key": "abc-123",
    "correlation_id": "req-789"
  }'
```

Respuesta esperada (201):
```json
{
  "success": true,
  "correlationId": "req-789",
  "data": {
    "customer": {
      "id": 1,
      "name": "ACME Corp",
      "email": "ops@acme.com",
      "phone": "+1-555-0100"
    },
    "order": {
      "id": 101,
      "status": "CONFIRMED",
      "total_cents": 389700,
      "items": [
        {
          "product_id": 2,
          "qty": 3,
          "unit_price_cents": 129900,
          "subtotal_cents": 389700
        }
      ]
    }
  }
}
```
