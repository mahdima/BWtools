"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Loader2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateCustomer } from "@/app/(dashboard)/customers/actions";

interface CustomerFormProps {
  customer: {
    id: string;
    username: string;
    email: string;
    phone: string;
  };
  trigger?: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      type="submit"
      className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Update Customer
    </button>
  );
}

export function CustomerForm({ customer, trigger }: CustomerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function clientAction(formData: FormData) {
    setMessage(null);
    const result = await updateCustomer(formData);

    if (result.success) {
      setIsOpen(false);
    } else {
      setMessage(result.message);
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <button className="text-gray-500 hover:text-blue-600">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-lg text-gray-900">
                  Edit Customer
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form action={clientAction} className="p-6 space-y-4">
                <input type="hidden" name="id" value={customer.id} />

                {message && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email (Read-only)
                  </label>
                  <input
                    disabled
                    defaultValue={customer.email}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    name="username"
                    defaultValue={customer.username || ""}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    name="phone"
                    defaultValue={customer.phone || ""}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
                    placeholder="+213..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <SubmitButton />
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
