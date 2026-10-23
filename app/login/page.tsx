"use client";

import { use, useActionState } from "react";
import { login } from "./actions";
import material from "../../img/material.jpg";
import logo from "../../img/Asset 3.png";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "@/components/language-picker";

const initialState = {
  error: "",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, formAction, isPending] = useActionState(login, initialState);
  const { error: redirectError } = use(searchParams);
  const errorMessage =
    state?.error ||
    (redirectError === "unauthorized"
      ? t("noAccess")
      : redirectError === "reset_link"
        ? t("resetLinkInvalid")
        : "");

  return (
    <div className="relative flex min-h-screen bg-card">
      <LanguagePicker className="absolute top-4 end-4 z-10" />
      {/* Left Side - Login Form */}
      <div className="w-full mt-20 lg:w-1/2 flex  justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center mb-10 w-full">
            <div className="w-full h-full mb-4">
              <Image
                src={logo}
                alt="WBtools Logo"
                className="w-full h-full object-contain dark:brightness-0 dark:invert"
                priority
              />
            </div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight text-center">
              {t("welcome")}
            </h2>
          </div>

          <form className="mt-8 space-y-6" action={formAction}>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground/80"
                >
                  {tc("emailAddress")}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-3 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition duration-200"
                    placeholder={tc("emailPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground/80"
                >
                  {t("password")}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-3 border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20">
                {errorMessage}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-strong focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 transform hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? t("signingIn") : t("signIn")}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:text-primary-strong text-sm"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-muted">
        <Image
          src={material}
          alt="Login Background"
          className="w-full h-full object-cover"
          fill
          priority
        />
      </div>
    </div>
  );
}
