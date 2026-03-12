import { z } from "zod";

const MESSAGE_TO_CODE: Record<string, string> = {
  "Email inválido": "invalid_email",
  "El email es requerido.": "required",
  "El nombre es requerido": "required",
  "El nombre debe ser texto.": "invalid_type",
  "El email debe ser texto.": "invalid_type",
  "El id debe ser un número entero positivo.": "invalid_id",
  "Debe ser un número entero positivo": "invalid_number",
  "Debe ser un número entero": "invalid_number",
  "No puede ser negativo": "negative_not_allowed",
  "El nombre no puede superar 255 caracteres.": "max_length",
  "El teléfono no puede superar 100 caracteres.": "max_length",
  "El teléfono solo puede contener el símbolo + (para extensión) y dígitos; no se permiten letras ni otros caracteres especiales.": "invalid_phone",
  "SKU es requerido": "required",
  "El nombre no puede estar vacío.": "required",
  "customer_id debe ser un número entero positivo": "invalid_number",
  "product_id debe ser un número entero positivo": "invalid_number",
  "qty debe ser un número entero positivo": "invalid_number",
  "items debe tener al menos un elemento": "min_items",
};

function messageToCode(message: string): string {
  return MESSAGE_TO_CODE[message] ?? "invalid_value";
}

export interface ValidationErrorDetail {
  path: string[];
  message: string;
  code: string;
}

export function formatZodError(error: z.ZodError): {
  error: string;
  code: string;
  details: ValidationErrorDetail[];
} {
  const details: ValidationErrorDetail[] = error.errors.map((e) => ({
    path: e.path.map(String).filter(Boolean),
    message: e.message,
    code: messageToCode(e.message),
  }));
  return {
    error: "Validation error",
    code: "VALIDATION_ERROR",
    details,
  };
}
