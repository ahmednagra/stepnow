// src/app/admin/(authed)/pricing/page.tsx
import Link from "next/link";
import { ChevronRight, Tags } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, ServiceAdmin } from "@/types";
import { AdminPageHeader, AdminCard } from "@/components/admin";

export const dynamic = "force-dynamic";

async function loadServices(): Promise<ServiceAdmin[]> {
  const token = await getAccessTokenFromCookies();
  if (!token) return [];
  const res = await serverApiClient.get<Paginated<ServiceAdmin>>(
    ENDPOINTS.ADMIN.SERVICES,
    { params: { size: 100 } },
    token,
  );
  return (res.data?.items ?? []).filter((s) => !s.is_deleted);
}

export default async function PricingIndexPage() {
  const services = await loadServices();

  return (
    <>
      <AdminPageHeader
        title="Pricing"
        description="Pick a service to manage its pricing categories and items."
      />
      <div className="p-6">
        <AdminCard
          flush
          title={`${services.length} service${services.length === 1 ? "" : "s"}`}
        >
          {services.length === 0 ? (
            <p className="p-8 text-center text-[12px] text-slate-500">
              No active services. Create a service first under{" "}
              <Link href="/admin/services" className="underline">
                Services
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {services.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/pricing/${s.id}`}
                    className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Tags className="h-3.5 w-3.5 text-slate-400" />
                      <div>
                        <p className="text-[13px] font-medium text-slate-900">{s.title_de}</p>
                        <p className="text-[11px] text-slate-500">{s.title_en}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </>
  );
}
