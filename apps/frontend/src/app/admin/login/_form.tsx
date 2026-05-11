// src/app/admin/login/_form.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { login } from "@/services/auth";
import { ApiError } from "@/lib/api-errors";
import { adminLoginSchema, type AdminLoginInput } from "@/schemas/admin-login.schema";
import { BrandMark } from "@/components/shared";
import {
  AdminFormField,
  adminInputClass,
} from "@/components/admin/AdminFormField";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/admin";
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AdminLoginInput) {
    setSubmitError(null);
    try {
      await login(values);
      router.push(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setSubmitError("Incorrect email or password.");
        } else {
          setSubmitError(err.message || "Sign in failed.");
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandMark size={26} tone="dark" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-900">
            StepNow Admin
          </span>
        </div>

        <div className="border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-base font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-[12px] text-slate-500">Authorized personnel only.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <AdminFormField
              label="Email"
              htmlFor="email"
              required
              error={errors.email?.message}
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                className={adminInputClass}
                disabled={isSubmitting}
                {...register("email")}
              />
            </AdminFormField>

            <AdminFormField
              label="Password"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={adminInputClass}
                disabled={isSubmitting}
                {...register("password")}
              />
            </AdminFormField>

            {submitError && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
              >
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-10 items-center justify-center gap-2 bg-slate-900 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Forgot your password? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
