import { z } from "zod";

export function formatPhoneNumber(value: string): string {
  const digits = value.replaceAll(/\D/g, "").slice(0, 10);
  if (digits.length === 0) {
    return "";
  }
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function handleMaskedPhoneChange(
  value: string,
  onChange: (masked: string) => void
) {
  onChange(formatPhoneNumber(value));
}

export const phoneSchema = z
  .string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Enter a 10-digit phone number");

export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine(
    (value) =>
      value === undefined ||
      value === "" ||
      /^\(\d{3}\) \d{3}-\d{4}$/.test(value),
    "Enter a 10-digit phone number"
  );
