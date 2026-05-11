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
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
