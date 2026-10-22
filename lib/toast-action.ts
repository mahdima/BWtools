import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

// Runs a server action from the browser and shows its result as a toast.
// Returns whether it succeeded. A thrown error (whose message Next.js hides in
// production) becomes a generic error toast.
export async function runWithToast(action: () => Promise<ActionResult>): Promise<boolean> {
  try {
    const result = await action();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    return result.success;
  } catch (error) {
    console.error(error);
    toast.error("Something went wrong. Please try again.");
    return false;
  }
}
