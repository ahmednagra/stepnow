import {
  GraduationCap,
  HeartPulse,
  Package,
  Plane,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_BY_KEY: Record<string, LucideIcon> = {
  flughafentransfer: Plane,
  "airport-transfer": Plane,
  airport: Plane,
  plane: Plane,
  flight: Plane,
  krankenhausfahrten: HeartPulse,
  "hospital-transport": HeartPulse,
  hospital: HeartPulse,
  clinic: HeartPulse,
  medical: HeartPulse,
  heartpulse: HeartPulse,
  schuelerbefoerderung: GraduationCap,
  "school-transport": GraduationCap,
  school: GraduationCap,
  student: GraduationCap,
  graduationcap: GraduationCap,
  "shuttle-service": Users,
  shuttle: Users,
  group: Users,
  users: Users,
  courier: Package,
  "courier-transport": Package,
  "kurier-sondertransport": Package,
  default: ShieldCheck,
};

function normalizeKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function getServiceIcon(
  iconValue: string | null | undefined,
  slug?: string | null,
): LucideIcon {
  const iconKey = normalizeKey(iconValue);
  if (iconKey && ICON_BY_KEY[iconKey]) return ICON_BY_KEY[iconKey];

  const slugKey = normalizeKey(slug);
  if (slugKey && ICON_BY_KEY[slugKey]) return ICON_BY_KEY[slugKey];

  return ICON_BY_KEY.default;
}
