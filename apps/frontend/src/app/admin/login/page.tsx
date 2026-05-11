// src/app/admin/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "./_form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <LoginForm />
    </Suspense>
  );
}
