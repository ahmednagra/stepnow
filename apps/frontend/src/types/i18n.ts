// src/types/i18n.ts

export type Locale = "de" | "en";

export type UiStringsMap = Record<string, string>;

export interface PublicUiStringsResponse {
  locale: Locale;
  strings: UiStringsMap;
}

export interface UiStringAdmin {
  id: string;
  key: string;
  namespace: string | null;
  value_de: string;
  value_en: string;
  description: string | null;
  is_locked: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
