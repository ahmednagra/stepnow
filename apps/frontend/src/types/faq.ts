// src/types/faq.ts

export interface FaqPublic {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface FaqAdmin {
  id: string;
  category: string;
  question_de: string;
  question_en: string;
  answer_de: string;
  answer_en: string;
  sort_order: number;
  active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
