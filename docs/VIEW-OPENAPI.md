# Cómo ver la documentación OpenAPI

Tienes tres OpenAPI en el proyecto:

| Archivo | API |
|--------|-----|
| `customers-api/openapi.yaml` | Customers API (puerto 3001) |
| `orders-api/openapi.yaml` | Orders API (puerto 3002) |
| `docs/openapi-lambda.yaml` | Lambda Orquestador (puerto 3000) |

---

## 1. Swagger Editor (online)

1. Abre **https://editor.swagger.io**
2. **File → Import file** y elige uno de los `.yaml` anteriores.
3. Verás la doc en el panel derecho. Con **Try it out** puedes llamar a los endpoints si las APIs están en `localhost`.

---

## 2. Swagger UI con Docker (local)

Desde la **raíz del repo**:

**Customers API** (puerto 8080):

```bash
docker run --rm -p 8080:8080 -e SWAGGER_JSON_URL=/openapi.yaml \
  -v "$(pwd)/customers-api/openapi.yaml:/usr/share/nginx/html/openapi.yaml" \
  swaggerapi/swagger-ui
```

Abre **http://localhost:8080**.

**Orders API** (puerto 8081):

```bash
docker run --rm -p 8081:8080 -e SWAGGER_JSON_URL=/openapi.yaml \
  -v "$(pwd)/orders-api/openapi.yaml:/usr/share/nginx/html/openapi.yaml" \
  swaggerapi/swagger-ui
```

Abre **http://localhost:8081**.

---

## 3. VS Code / Cursor

- Instala la extensión **OpenAPI (Swagger) Editor** o **Swagger Viewer**.
- Abre el archivo `openapi.yaml` y usa la opción de **preview** para ver la documentación en el editor.
