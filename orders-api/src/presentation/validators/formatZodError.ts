import { z } from "zod";

const MESSAGE_TO_CODE: Record<string, string> = {
  "Email inválido": "invalid_email",
  "invalid_email": "invalid_email",
  "required": "required",
  "invalid_type": "invalid_type",
  "invalid_id": "invalid_id",
  "invalid_number": "invalid_number",
  "negative_not_allowed": "negative_not_allowed",
  "max_length": "max_length",
  "min_items": "min_items",
  "SKU es requerido": "required",
  "El nombre es requerido": "required",
  "customer_id debe ser un número entero positivo": "invalid_number",
  "product_id debe ser un número entero positivo": "invalid_number",
  "qty debe ser un número entero positivo": "invalid_number",
  "items debe tener al menos un elemento": "min_items",
  "price_cents debe ser un número entero no negativo": "invalid_number",
  "stock debe ser un número entero no negativo": "invalid_number",
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
