// src/types/legalPage.ts

export interface LegalPagePublic {
  slug: string;
  title: string;
  body: string;
  published_at: string | null;
  version_number: number | null;
}

export interface LegalPageVersionAdmin {
  id: string;
  page_id: string;
  version_number: number;
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
  changes_summary: string | null;
  is_published: boolean;
  created_at: string;
  created_by_email: string | null;
}

export interface LegalPageAdmin {
  id: string;
  slug: string;
  published_version: LegalPageVersionAdmin | null;
  draft_version: LegalPageVersionAdmin | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
