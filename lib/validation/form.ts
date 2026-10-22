import { z } from "zod";

export type ParseResult<T> = { success: true; data: T } | { success: false; message: string };

// Validates FormData (or a plain object) against a schema. On failure, returns the first
// problem as a sentence that can be shown to the user, e.g. "Price must be greater than 0."
export function parseForm<S extends z.ZodType>(
  schema: S,
  input: FormData | Record<string, unknown>,
): ParseResult<z.output<S>> {
  const values = input instanceof FormData ? Object.fromEntries(input) : input;
  const result = schema.safeParse(values);

  if (result.success) return { success: true, data: result.data };
  return { success: false, message: result.error.issues[0]?.message ?? "Invalid input." };
}

// Accepted image uploads and the file extension stored for each.
export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// An optional image input: an empty file input (size 0) counts as "no image".
export const optionalImage = z.preprocess(
  (value) => (value instanceof File && value.size === 0 ? undefined : value),
  z
    .instanceof(File, { error: "Image upload is invalid." })
    .refine((file) => file.type in IMAGE_TYPES, "Image must be a JPEG, PNG or WebP file.")
    .refine((file) => file.size <= MAX_IMAGE_BYTES, "Image must be 5 MB or smaller.")
    .optional(),
);

// Extension for a file that passed `optionalImage`, taken from its MIME type, not its name.
export function imageExtension(file: File): string {
  return IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
}
