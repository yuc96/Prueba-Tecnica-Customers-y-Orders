import { z } from "zod";

const CUSTOMER_ID_POSITIVE = "customer_id debe ser un número entero positivo.";
const PRODUCT_ID_POSITIVE = "product_id debe ser un número entero positivo.";
const QTY_POSITIVE = "qty debe ser un número entero positivo (mínimo 1).";
const ITEMS_MIN_ONE = "items debe tener al menos un elemento.";
const MUST_BE_INTEGER = "Debe ser un número entero (no decimales, ni letras ni caracteres especiales).";

function coercePositiveInt(message: string) {
  return z
    .coerce.number({ invalid_type_error: MUST_BE_INTEGER })
    .refine(Number.isInteger, MUST_BE_INTEGER)
    .refine((n) => n >= 1, message);
}

export const createOrderSchema = z.object({
  customer_id: coercePositiveInt(CUSTOMER_ID_POSITIVE),
  items: z
    .array(
      z.object({
        product_id: coercePositiveInt(PRODUCT_ID_POSITIVE),
        qty: coercePositiveInt(QTY_POSITIVE),
      })
    )
    .min(1, { message: ITEMS_MIN_ONE }),
});

const idParamSchema = z.string().refine(
  (val) => {
    const n = Number(val);
    return Number.isInteger(n) && n >= 1;
  },
  { message: "El id debe ser un número entero positivo." }
);

export function parseOrderIdParam(param: string): number {
  const result = idParamSchema.safeParse(param);
  if (!result.success) {
    const msg = result.error.errors[0]?.message ?? "El id debe ser un número entero positivo.";
    throw new Error(msg);
  }
  return Number(param);
}

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
