// src/types/vehicle.ts

export interface VehiclePublic {
  id: string;
  name: string;
  category: string;
  capacity_passengers: number;
  capacity_luggage: number;
  features: string[];
  image_url: string | null;
  sort_order: number;
}

export interface VehicleAdmin {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  capacity_passengers: number;
  capacity_luggage: number;
  features_de: string[];
  features_en: string[];
  image_url: string | null;
  sort_order: number;
  active: boolean;
  // public_visible=false → operational-only fleet car (kept off the public showcase).
  public_visible: boolean;
  // Operational fleet fields. A row carrying a `plate` is an operational car (e.g. "SN 9889").
  plate: string | null;
  ownership_type: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
