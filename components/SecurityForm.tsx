"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/app/(dashboard)/settings/actions";
import { Loader2 } from "lucide-react";

export function SecurityForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await updatePassword(formData);

    setLoading(false);
    setMessage({
      success: result.success,
      text: result.message,
    });

    if (result.success) {
      // Optional: Clear form
      (document.getElementById("security-form") as HTMLFormElement)?.reset();
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Password</h3>
        <p className="text-sm text-gray-500">
          Change your password to keep your account secure.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.success
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        id="security-form"
        action={handleSubmit}
        className="space-y-4 max-w-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
          />
        </div>
        <Button
          disabled={loading}
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </form>
    </div>
  );
}
