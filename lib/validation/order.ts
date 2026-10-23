import { z } from "zod";

// components/order-notes.tsx: an internal note on an order.
export const orderNoteSchema = z.object({
  note: z
    .string({ error: "noteEmpty" })
    .trim()
    .min(1, "noteEmpty")
    .max(2000, "noteTooLong"),
});
