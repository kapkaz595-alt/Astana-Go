export type CategoryStatus = 'active' | 'inactive';

export interface LocalizedText {
  zh?: string;
  ru?: string;
  kk?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  parent_id: string | null;
  sort_order: number;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
}