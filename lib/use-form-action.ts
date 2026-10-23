"use client";

import { startTransition, useActionState } from "react";
import type { ActionResult } from "@/lib/action-result";

type FormServerAction = (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;

// Submits a form to a server action and keeps the last result for showing errors.
// It submits from onSubmit rather than <form action>, because React resets a form's
// fields after an action runs, which would wipe what the user typed on a validation
// error. Server actions that succeed usually redirect(), which still navigates.
export function useFormAction(action: FormServerAction) {
  const [state, formAction, isPending] = useActionState(action, null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return { state, isPending, onSubmit };
}
