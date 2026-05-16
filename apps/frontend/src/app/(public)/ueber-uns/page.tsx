// apps/frontend/src/app/(public)/ueber-uns/page.tsx
// About page (DE). Revalidate 1h; admin-bff invalidates settings/vehicles tags on mutation.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listVehiclesServer } from "@/services/vehicles";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { ConcessionBadge, Container } from "@/components/shared";
import { Credentials, ServiceAreaMap, StorySection, ValuesSection } from "@/components/features/about";
import { FleetPreview } from "@/components/features/home";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
const stringsRes = await getUiStringsServer("de");
const t = createT(stringsRes.strings, "de");
return buildMetadata({ title: t("about.page.title"), description: t("about.page.subhead"), path: "/ueber-uns", locale: "de" });
}

export default async function AboutPageDe() {
const [stringsRes, settings, vehicles] = await Promise.all([getUiStringsServer("de"), getSettingsServer("de"), listVehiclesServer("de")]);
const t = createT(stringsRes.strings, "de");

return (
<>
<section className="bg-cream">
<Container className="pt-3 pb-6 md:pt-5 md:pb-8">
<header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-6">
<div>
<p className="label-eyebrow">{pickT(t, "about.page.eyebrow", "Über uns")}</p>
<h1 className="mt-1 font-serif text-[32px] leading-none tracking-tight md:text-[40px]">{t("about.page.title")}</h1>
</div>
<p className="max-w-md text-[13.5px] text-mute md:text-right">{t("about.page.subhead")}</p>
</header>
</Container>
</section>
<section className="border-t border-line bg-cream">
<Container className="grid items-start gap-10 py-10 md:grid-cols-12 md:gap-14 md:py-12">
<div className="md:col-span-7"><StorySection t={t} settings={settings} /></div>
<div className="md:col-span-5"><ValuesSection t={t} locale="de" /></div>
</Container>
</section>
<section className="border-t border-line bg-paper">
<Container className="grid items-start gap-10 py-10 md:grid-cols-12 md:gap-14 md:py-12">
<div className="md:col-span-7"><Credentials t={t} settings={settings} locale="de" /></div>
<div className="md:col-span-5"><ServiceAreaMap settings={settings} /></div>
</Container>
</section>
<FleetPreview t={t} vehicles={vehicles} locale="de" />
<section className="border-t border-line bg-cream">
<Container className="flex justify-center py-6 md:py-8"><ConcessionBadge settings={settings} tone="light" /></Container>
</section>
</>
);
}
