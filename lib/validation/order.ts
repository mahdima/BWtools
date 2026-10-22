import { z } from "zod";

// components/order-notes.tsx: an internal note on an order.
export const orderNoteSchema = z.object({
  note: z
    .string({ error: "Note cannot be empty." })
    .trim()
    .min(1, "Note cannot be empty.")
    .max(2000, "Note must be 2000 characters or fewer."),
});
