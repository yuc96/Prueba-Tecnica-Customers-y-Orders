# Documentación API

## OpenAPI 3.0 por servicio

| Servicio   | Archivo OpenAPI |
|-----------|------------------|
| Customers API | [../customers-api/openapi.yaml](../customers-api/openapi.yaml) |
| Orders API    | [../orders-api/openapi.yaml](../orders-api/openapi.yaml) |
| Lambda Orquestador | [openapi-lambda.yaml](openapi-lambda.yaml) |

Puedes visualizar los YAML con Swagger UI, Redoc o importarlos en Postman/Insomnia.

## Ejemplos cURL

[curl-examples.md](curl-examples.md) — ejemplos de todas las operaciones (Customers, Orders, Lambda) listos para ejecutar en terminal.

## Colección Postman / Insomnia (opcional)

**Archivo**: [B2B-Orders-System.postman_collection.json](B2B-Orders-System.postman_collection.json)

- **Postman**: File → Import → seleccionar el JSON.
- **Insomnia**: Importar como colección Postman (soporte nativo).

Variables de colección (editar en la colección o en entorno):

- `base_customers`: http://localhost:3001  
- `base_orders`: http://localhost:3002  
- `base_lambda`: http://localhost:3000  
- `service_token`: shared-internal-token (o el valor de `SERVICE_TOKEN` de tu `.env`)  
- `customer_id`, `order_id`, `product_id`: IDs de ejemplo (1, 1, 2).
