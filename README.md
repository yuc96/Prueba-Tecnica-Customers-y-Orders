# B2B Orders System

Sistema mínimo de backoffice B2B: **Customers API**, **Orders API** y **Lambda orquestador**. Desarrollado con **Bun**, **arquitectura limpia (hexagonal)** y MySQL.

---

## Requisitos

- [Bun](https://bun.sh/) (para migración, seed y orquestador en local)
- [Docker](https://docs.docker.com/get-docker/) con el plugin **Compose** (`docker compose`)

---

## Cómo funciona el proyecto

### Cuando está corriendo en Docker

1. **MySQL** (contenedor `mysql`): base de datos `b2b_orders` compartida. Ahí viven las tablas `customers`, `products`, `orders`, `order_items` e `idempotency_keys`.

2. **Customers API** (puerto 3001): gestiona clientes (CRUD, búsqueda, soft-delete). Expone un endpoint interno `GET /internal/customers/:id` protegido por `SERVICE_TOKEN`, que usa **Orders API** para validar que el cliente existe antes de crear un pedido.

3. **Orders API** (puerto 3002): gestiona productos y pedidos.
   - **Productos**: CRUD y stock.
   - **Pedidos**: al crear uno (`POST /orders`), valida el cliente llamando a Customers API (`/internal/customers/:id`), comprueba stock, crea la orden en estado `CREATED` y descuenta stock en una sola transacción. La confirmación (`POST /orders/:id/confirm`) es idempotente con el header `X-Idempotency-Key`. La cancelación restaura stock si está `CREATED`, o permite cancelar `CONFIRMED` solo dentro de 10 minutos.

4. **Lambda orquestador** (fuera del Compose): Se ejecuta en tu máquina con `bun run dev` (serverless-offline) en el puerto 3000. Recibe una sola petición (`POST /orchestrator/create-and-confirm-order`), valida el cliente en Customers API, crea el pedido en Orders API y lo confirma con la misma idempotency key, y devuelve un JSON con el cliente y el pedido confirmado. Así se simula un flujo “crear y confirmar en un solo paso” como en AWS Lambda.

### Flujo de datos (resumen)

```
[Cliente/Postman] → Customers API (clientes)
                 → Orders API (productos, pedidos: crear → confirmar/cancelar)
                 → Lambda orquestador (crear + confirmar en una llamada)
                        ↓
                 Lambda llama a Customers API + Orders API por HTTP
```

---

## Despliegue en local (paso a paso)

Sigue estos pasos en orden para tener el proyecto corriendo en local con Docker.

### Paso 1: Clonar y entrar en el proyecto

```bash
git clone <url-del-repo>
cd "Customers y Orders"
```

### Paso 2: Variables de entorno (opcional)

Las APIs en Docker usan variables por defecto. Si quieres cambiarlas:

```bash
cp customers-api/.env.example customers-api/.env
cp orders-api/.env.example orders-api/.env
# Edita .env si necesitas otro usuario/contraseña de MySQL o SERVICE_TOKEN
```

El `docker-compose.yml` ya define `MYSQL_USER=app`, `MYSQL_PASSWORD=app`, `MYSQL_DATABASE=b2b_orders` y `SERVICE_TOKEN=shared-internal-token` (o el que pongas en `.env` con `SERVICE_TOKEN=...`).

### Paso 3: Levantar MySQL y las APIs con Docker

Desde la **raíz del proyecto**:

```bash
docker compose up -d
```

Se construyen y levantan:

- **mysql** (puerto 3306)
- **customers-api** (puerto 3001)
- **orders-api** (puerto 3002)

Espera unos segundos a que MySQL pase el healthcheck.

### Paso 4: Migración y datos iniciales

Al arrancar, cada API en Docker ejecuta **migrate** y **seed** automáticamente (crean tablas y datos de ejemplo). No hace falta hacer nada más.

Si levantaste los contenedores **antes** de tener esta lógica y ves el error `Table 'b2b_orders.customers' doesn't exist`, ejecuta una vez desde la raíz del proyecto:

```bash
cd customers-api
MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_USER=app MYSQL_PASSWORD=app MYSQL_DATABASE=b2b_orders bun run migrate
MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_USER=app MYSQL_PASSWORD=app MYSQL_DATABASE=b2b_orders bun run seed
cd ..
```

Luego las APIs ya podrán usar la base con normalidad.

### Paso 5: Comprobar que todo responde

```bash
curl -s http://localhost:3001/health
# {"status":"ok","service":"customers-api"}

curl -s http://localhost:3002/health
# {"status":"ok","service":"orders-api"}
```

Si ves esas respuestas, el despliegue en local está listo. Puedes usar las APIs directamente o ejecutar el orquestador (siguiente sección).

---

## Ejecutar el orquestador en local

El orquestador **no** va en Docker. Se ejecuta en tu máquina y llama a las APIs por HTTP (localhost cuando Customers y Orders están en Docker).

### Paso 1: Tener las APIs levantadas

Asegúrate de que **Customers API** y **Orders API** están corriendo (p. ej. `docker compose up -d` y los healthchecks OK).

### Paso 2: Configurar el orquestador

En la raíz del proyecto:

```bash
cd lambda-orchestrator
```

Crea un archivo `.env` (o copia desde un ejemplo si lo tienes) con:

```env
CUSTOMERS_API_BASE=http://localhost:3001
ORDERS_API_BASE=http://localhost:3002
SERVICE_TOKEN=shared-internal-token
```

- Si las APIs están en Docker y el orquestador en tu máquina, `localhost` es correcto (los puertos 3001 y 3002 están mapeados al host).
- `SERVICE_TOKEN` debe ser el **mismo** que el que usan las APIs en Docker (por defecto `shared-internal-token`).

### Paso 3: Instalar dependencias y arrancar

Sigue en `lambda-orchestrator`:

```bash
bun install
bun run dev
```

Se compila el proyecto y se inicia **serverless-offline**. Deberías ver algo como que el servidor está escuchando en el puerto **3000**.

### Paso 4: Llamar al endpoint del orquestador

Desde **otra terminal** (o Postman/Bruno):

```bash
curl -X POST http://localhost:3000/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [{"product_id": 2, "qty": 3}],
    "idempotency_key": "abc-123",
    "correlation_id": "req-789"
  }'
```

Respuesta esperada (201): un JSON con `success: true`, `correlationId` y `data` con el cliente y el pedido ya en estado `CONFIRMED` y sus items.

### Paso 5 (opcional): Exponer con ngrok

Si quieres llamar al orquestador desde fuera (p. ej. otro equipo o un webhook):

```bash
ngrok http 3000
```

Usa la URL que te da ngrok como base para `POST .../orchestrator/create-and-confirm-order`. El orquestador seguirá usando `localhost` para hablar con las APIs.

---

## Variables de entorno

### customers-api (Docker / local)

| Variable       | Descripción             | Por defecto en Docker |
| -------------- | ----------------------- | --------------------- |
| PORT           | Puerto HTTP             | 3001                  |
| MYSQL_HOST     | Host MySQL              | mysql (en Compose)    |
| MYSQL_PORT     | Puerto MySQL            | 3306                  |
| MYSQL_USER     | Usuario MySQL           | app                   |
| MYSQL_PASSWORD | Contraseña MySQL        | app                   |
| MYSQL_DATABASE | Base de datos           | b2b_orders            |
| SERVICE_TOKEN  | Token para /internal/\* | shared-internal-token |

### orders-api (Docker / local)

| Variable           | Descripción                | Por defecto en Docker     |
| ------------------ | -------------------------- | ------------------------- |
| (igual que arriba) | + PORT 3002                | -                         |
| CUSTOMERS_API_BASE | URL base Customers API     | http://customers-api:3001 |
| SERVICE_TOKEN      | Mismo que en customers-api | shared-internal-token     |

### lambda-orchestrator (solo local o AWS)

| Variable           | Descripción              |
| ------------------ | ------------------------ |
| CUSTOMERS_API_BASE | URL Customers API        |
| ORDERS_API_BASE    | URL Orders API           |
| SERVICE_TOKEN      | Mismo token que las APIs |

---

## URLs base en local

| Servicio         | URL                   |
| ---------------- | --------------------- |
| Customers API    | http://localhost:3001 |
| Orders API       | http://localhost:3002 |
| Lambda (offline) | http://localhost:3000 |

---

## Desplegar el Lambda en AWS

1. Configura AWS CLI y credenciales.
2. En `lambda-orchestrator`, define (en `.env` o en el provider de Serverless) las URLs **públicas** de las APIs y el token:
   - `CUSTOMERS_API_BASE=https://tu-customers-api.com`
   - `ORDERS_API_BASE=https://tu-orders-api.com`
   - `SERVICE_TOKEN=...`
3. Ejecuta: `bun run deploy`
4. Invoca la URL que devuelve Serverless (API Gateway) con el mismo body del ejemplo de cURL del orquestador.

---

## Documentación y colecciones

- **OpenAPI 3.0**: [customers-api/openapi.yaml](customers-api/openapi.yaml), [orders-api/openapi.yaml](orders-api/openapi.yaml), [docs/openapi-lambda.yaml](docs/openapi-lambda.yaml).
- **Ejemplos cURL**: [docs/curl-examples.md](docs/curl-examples.md).
- **Postman/Insomnia**: [docs/B2B-Orders-System.postman_collection.json](docs/B2B-Orders-System.postman_collection.json).
- **Bruno**: carpeta [bruno/](bruno/), entorno `local` en `bruno/environments/local.bru`.

### Cómo ver la documentación OpenAPI en el navegador

**Opción 1 – Swagger Editor (online, sin instalar nada)**  
1. Entra en **https://editor.swagger.io**  
2. Menú **File → Import file** (o pega el contenido del YAML).  
3. Elige `customers-api/openapi.yaml` u `orders-api/openapi.yaml`.  
4. Verás la documentación y podrás probar los endpoints si tu API está en `localhost`.

**Opción 2 – Swagger UI con Docker (local)**  
Desde la **raíz del proyecto**:

```bash
# Customers API
docker run --rm -p 8080:8080 -e SWAGGER_JSON_URL=/openapi.yaml \
  -v "$(pwd)/customers-api/openapi.yaml:/usr/share/nginx/html/openapi.yaml" \
  swaggerapi/swagger-ui

# Abre: http://localhost:8080
```

Para **Orders API**, en otra terminal (y otro puerto):

```bash
docker run --rm -p 8081:8080 -e SWAGGER_JSON_URL=/openapi.yaml \
  -v "$(pwd)/orders-api/openapi.yaml:/usr/share/nginx/html/openapi.yaml" \
  swaggerapi/swagger-ui

# Abre: http://localhost:8081
```

**Opción 3 – Extensión de VS Code**  
Instala la extensión **OpenAPI (Swagger) Editor** o **Swagger Viewer**. Abre el archivo `.yaml` y usa “Preview” para ver la doc en el editor.

---

## Scripts por servicio

| Servicio            | dev           | start           | migrate           | seed           |
| ------------------- | ------------- | --------------- | ----------------- | -------------- |
| customers-api       | `bun run dev` | `bun run start` | `bun run migrate` | `bun run seed` |
| orders-api          | `bun run dev` | `bun run start` | `bun run migrate` | `bun run seed` |
| lambda-orchestrator | `bun run dev` | -               | -                 | -              |
# Prueba-Tecnica-Customers-y-Orders
