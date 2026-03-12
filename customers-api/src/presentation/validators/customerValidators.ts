import { z } from "zod";

const EMAIL_INVALID = "Email inválido. Debe ser una dirección de correo válida.";
const NAME_REQUIRED = "El nombre es requerido y no puede estar vacío.";
const NAME_MAX = "El nombre no puede superar 255 caracteres.";
const PHONE_MAX = "El teléfono no puede superar 100 caracteres.";
const PHONE_INVALID =
  "El teléfono solo puede contener el símbolo + (para extensión) y dígitos; no se permiten letras ni otros caracteres especiales.";
const ID_MUST_BE_POSITIVE_INT = "El id debe ser un número entero positivo.";

/** Solo permite + opcional al inicio y dígitos (y espacios/guiones como separadores). */
const phoneRegex = /^\+?[0-9][0-9\s\-]*$/;

export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: NAME_REQUIRED, invalid_type_error: "El nombre debe ser texto." })
    .min(1, { message: NAME_REQUIRED })
    .max(255, { message: NAME_MAX })
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: NAME_REQUIRED }),
  email: z
    .string({ required_error: "El email es requerido.", invalid_type_error: "El email debe ser texto." })
    .min(1, { message: "El email es requerido." })
    .email({ message: EMAIL_INVALID })
    .toLowerCase(),
  phone: z
    .string()
    .max(100, { message: PHONE_MAX })
    .optional()
    .refine((s) => s === undefined || s === "" || phoneRegex.test(String(s).trim()), {
      message: PHONE_INVALID,
    })
    .transform((s) => (s === "" || s == null ? undefined : (s as string).trim())),
});

export const updateCustomerSchema = z.object({
  name: z
    .string({ invalid_type_error: "El nombre debe ser texto." })
    .min(1, { message: NAME_REQUIRED })
    .max(255, { message: NAME_MAX })
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: NAME_REQUIRED })
    .optional(),
  email: z
    .string({ invalid_type_error: "El email debe ser texto." })
    .min(1, { message: "El email no puede estar vacío." })
    .email({ message: EMAIL_INVALID })
    .toLowerCase()
    .optional(),
  phone: z
    .string()
    .max(100, { message: PHONE_MAX })
    .optional()
    .refine((s) => s === undefined || s === "" || phoneRegex.test(String(s).trim()), {
      message: PHONE_INVALID,
    })
    .transform((s) => (s === "" || s == null ? undefined : (s as string).trim())),
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

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
