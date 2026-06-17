// apps/frontend/src/app/admin/(authed)/layout.tsx
// Client-side auth guard. Reads the localStorage token, validates via /auth/me, and
// redirects to login when there's no token, the token is rejected, or the admin is inactive.

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentAdmin } from "@/hooks/queries/useCurrentAdmin";
import { getAccessToken, clearTokens } from "@/lib/auth-storage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CommandPalette } from "@/components/admin";

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#FAFAF7] text-[13px] text-slate-500">
      Loading…
    </div>
  );
}

export default function AdminAuthedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasToken = mounted && Boolean(getAccessToken());
  const { data: admin, isLoading, isError } = useCurrentAdmin();
  const invalid = isError || (admin != null && !admin.active);

  useEffect(() => {
    if (!mounted) return;
    if (!hasToken || invalid) {
      clearTokens();
      router.replace(`/admin/login?next=${encodeURIComponent(pathname ?? "/admin")}`);
    }
  }, [mounted, hasToken, invalid, pathname, router]);

  if (!mounted || !hasToken || isLoading || invalid || !admin) return <Loading />;

  return (
    <AdminLayout admin={admin}>
      {children}
      <CommandPalette />
    </AdminLayout>
  );
}
