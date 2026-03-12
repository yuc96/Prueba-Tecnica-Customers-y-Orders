# Bruno – B2B Orders, Customers & Orders

Colección de [Bruno](https://www.usebruno.com/) con todas las peticiones de **Customers API**, **Orders API** y **Lambda Orquestador**.

## Cómo usar

1. Instala [Bruno](https://www.usebruno.com/downloads) (app o CLI).
2. Abre Bruno y **Open Collection** → selecciona la carpeta `bruno` de este repo.
3. Elige el entorno **local** en el selector de entornos (variables en `environments/local.bru`).
4. Ejecuta las peticiones desde las carpetas **Customers**, **Orders** y **Lambda**.

## Estructura

```
bruno/
├── bruno.json           # Config de la colección
├── environments/
│   └── local.bru        # Variables: base_customers, base_orders, base_lambda, service_token, ids
├── Customers/           # Customers API (7 peticiones)
├── Orders/              # Orders API – productos y pedidos (10 peticiones)
└── Lambda/              # Lambda orquestador (1 petición)
```

## Variables (entorno local)

| Variable         | Valor por defecto        |
|------------------|--------------------------|
| base_customers   | http://localhost:3001    |
| base_orders      | http://localhost:3002    |
| base_lambda      | http://localhost:3000    |
| service_token    | shared-internal-token    |
| customer_id      | 1                        |
| order_id         | 1                        |
| product_id       | 2                        |

Puedes editar `environments/local.bru` o crear otros entornos (por ejemplo `staging.bru`).
