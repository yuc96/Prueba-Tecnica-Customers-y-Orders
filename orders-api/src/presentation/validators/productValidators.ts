import { z } from "zod";

const ID_MUST_BE_POSITIVE_INT = "El id debe ser un número entero positivo.";
const NAME_REQUIRED = "El nombre es requerido y no puede estar vacío.";
const SKU_REQUIRED = "El SKU es requerido y no puede estar vacío.";
const PRICE_NON_NEGATIVE_INT = "price_cents debe ser un número entero no negativo (0 o más).";
const STOCK_NON_NEGATIVE_INT = "stock debe ser un número entero no negativo (0 o más).";
const MUST_BE_INTEGER = "Debe ser un número entero (no decimales, ni letras ni caracteres especiales).";

const positiveInt = z
  .number({ required_error: MUST_BE_INTEGER, invalid_type_error: MUST_BE_INTEGER })
  .int(MUST_BE_INTEGER)
  .positive(ID_MUST_BE_POSITIVE_INT);

const nonNegativeInt = z
  .number({ invalid_type_error: MUST_BE_INTEGER })
  .int(MUST_BE_INTEGER)
  .min(0, { message: PRICE_NON_NEGATIVE_INT });

export const createProductSchema = z.object({
  sku: z
    .string({ required_error: SKU_REQUIRED, invalid_type_error: "El SKU debe ser texto." })
    .min(1, { message: SKU_REQUIRED })
    .max(100, { message: "El SKU no puede superar 100 caracteres." })
    .trim(),
  name: z
    .string({ required_error: NAME_REQUIRED, invalid_type_error: "El nombre debe ser texto." })
    .min(1, { message: NAME_REQUIRED })
    .max(255, { message: "El nombre no puede superar 255 caracteres." })
    .trim(),
  price_cents: z
    .number({ required_error: PRICE_NON_NEGATIVE_INT, invalid_type_error: MUST_BE_INTEGER })
    .int(MUST_BE_INTEGER)
    .min(0, { message: PRICE_NON_NEGATIVE_INT }),
  stock: z
    .number({ invalid_type_error: MUST_BE_INTEGER })
    .int(MUST_BE_INTEGER)
    .min(0, { message: STOCK_NON_NEGATIVE_INT })
    .optional()
    .default(0),
});

export const updateProductSchema = z.object({
  name: z
    .string({ invalid_type_error: "El nombre debe ser texto." })
    .min(1, { message: NAME_REQUIRED })
    .max(255, { message: "El nombre no puede superar 255 caracteres." })
    .trim()
    .optional(),
  price_cents: nonNegativeInt.optional(),
  stock: nonNegativeInt.optional(),
});

const idParamSchema = z.string().refine(
  (val) => {
    const n = Number(val);
    return Number.isInteger(n) && n >= 1;
  },
  { message: ID_MUST_BE_POSITIVE_INT }
);

export function parseIdParam(param: string): number {
  const result = idParamSchema.safeParse(param);
  if (!result.success) {
    const msg = result.error.errors[0]?.message ?? ID_MUST_BE_POSITIVE_INT;
    throw new Error(msg);
  }
  return Number(param);
}

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
