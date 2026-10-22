"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { requestPasswordReset } from "./actions";
import { useFormAction } from "@/lib/use-form-action";

export default function ForgotPasswordPage() {
  const { state, isPending, onSubmit } = useFormAction(requestPasswordReset);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your admin email and we&apos;ll send you a link to choose a new password.
          </p>
        </div>

        {state?.success ? (
          <div role="status" className="p-4 rounded-md border border-green-200 bg-green-50 text-sm text-green-700">
            {state.message}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            {state && !state.success && (
              <div role="alert" className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-strong disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:text-primary-strong">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
