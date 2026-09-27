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

export function stripPhoneDigits(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 10);
}

export function formatPhoneDigits(digits: string): string {
  const clean = stripPhoneDigits(digits);
  if (clean.length !== 10) {
    return clean;
  }
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
}

export function normalizePhoneToMasked(
  value: string | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }
  const digits = stripPhoneDigits(value);
  if (digits.length !== 10) {
    return value;
  }
  return formatPhoneDigits(digits);
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

export const optionalPhoneDigitsSchema = z
  .string()
  .optional()
  .refine(
    (value) => value === undefined || value === "" || /^\d{10}$/.test(value),
    "Enter a 10-digit phone number"
  );

export const optionalFlexiblePhoneSchema = z
  .string()
  .optional()
  .refine(
    (value) =>
      value === undefined ||
      value === "" ||
      /^\d{10}$/.test(value) ||
      /^\(\d{3}\) \d{3}-\d{4}$/.test(value),
    "Enter a 10-digit phone number"
  );
