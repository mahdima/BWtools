import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

// Runs a server action from the browser and shows its result as a toast.
// Returns whether it succeeded. A thrown error (whose message Next.js hides in
// production) becomes a generic error toast.
// `unexpected` is the fallback error; components pass it translated (useRunWithToast).
export async function runWithToast(
  action: () => Promise<ActionResult>,
  unexpected = "Something went wrong. Please try again.",
): Promise<boolean> {
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
    toast.error(unexpected);
    return false;
  }
}
