// Schema kontrak form runtime — sumber kebenaran untuk builder, renderer,
// validator, dan snapshot pada saat publish.
import { z } from "zod";

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "dropdown",
  "checkbox",
  "radio",
  "number",
  "date",
  "file_upload",
  "multi_file_upload",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const fieldOptionSchema = z.object({
  value: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(160),
});
export type FieldOption = z.infer<typeof fieldOptionSchema>;

export const fieldValidationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().max(20000).optional(),
    pattern: z.string().max(500).optional(),
    accept: z.array(z.string().max(80)).max(20).optional(),
    maxSizeMb: z.number().positive().max(50).optional(),
    maxFiles: z.number().int().positive().max(20).optional(),
  })
  .partial();
export type FieldValidation = z.infer<typeof fieldValidationSchema>;

export const visibleIfSchema = z
  .object({
    field: z.string().min(1).max(60),
    op: z.enum(["eq", "neq", "in", "not_in", "filled", "empty"]),
    value: z.union([z.string().max(200), z.array(z.string().max(200)).max(50)]).optional(),
  })
  .nullable()
  .optional();
export type VisibleIfRule = z.infer<typeof visibleIfSchema>;

export const formFieldSchema = z.object({
  kode: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z][a-z0-9_]*$/, "kode hanya huruf kecil, angka, underscore"),
  label: z.string().trim().min(1).max(200),
  tipe: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  placeholder: z.string().max(200).optional().nullable(),
  help_text: z.string().max(500).optional().nullable(),
  options: z.array(fieldOptionSchema).max(50).default([]),
  validation: fieldValidationSchema.default({}),
  visible_if: visibleIfSchema,
  urutan: z.number().int().nonnegative().default(0),
});
export type FormField = z.infer<typeof formFieldSchema>;

/** Evaluasi kondisi visible_if terhadap nilai form saat ini. */
export function isFieldVisible(field: FormField, values: Record<string, unknown>): boolean {
  const rule = field.visible_if;
  if (!rule) return true;
  const v = values[rule.field];
  const asStr = v == null ? "" : Array.isArray(v) ? v.map(String) : String(v);
  switch (rule.op) {
    case "filled":
      return Array.isArray(asStr) ? asStr.length > 0 : asStr !== "";
    case "empty":
      return Array.isArray(asStr) ? asStr.length === 0 : asStr === "";
    case "eq":
      return Array.isArray(asStr)
        ? asStr.includes(String(rule.value ?? ""))
        : asStr === String(rule.value ?? "");
    case "neq":
      return Array.isArray(asStr)
        ? !asStr.includes(String(rule.value ?? ""))
        : asStr !== String(rule.value ?? "");
    case "in": {
      const list = Array.isArray(rule.value) ? rule.value : rule.value ? [rule.value] : [];
      return Array.isArray(asStr) ? asStr.some((x) => list.includes(x)) : list.includes(asStr);
    }
    case "not_in": {
      const list = Array.isArray(rule.value) ? rule.value : rule.value ? [rule.value] : [];
      return Array.isArray(asStr) ? !asStr.some((x) => list.includes(x)) : !list.includes(asStr);
    }
    default:
      return true;
  }
}

export const formSchemaSnapshotSchema = z.object({
  version: z.literal(1),
  fields: z.array(formFieldSchema).min(1).max(100),
  publishedAt: z.string().datetime().optional(),
});
export type FormSchemaSnapshot = z.infer<typeof formSchemaSnapshotSchema>;

export function emptySnapshot(): FormSchemaSnapshot {
  return { version: 1, fields: [] as unknown as FormSchemaSnapshot["fields"] };
}
