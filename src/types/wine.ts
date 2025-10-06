export interface Wine {
  id: string;
  name: string;
  description: string;
  category: string;
  vintage?: string;
  price: number;
  region?: string;
  varietal?: string;
  supplier_id?: string;
  supplier?: string;
  selected: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
}

export interface WineListConfig {
  id: string;
  name: string;
  companyInfo: CompanyInfo;
  selectedWines: Wine[];
  createdAt: Date;
  updatedAt: Date;
}

export type WineCategory = 'Red Wine' | 'White Wine' | 'Sparkling Wine' | 'Rosé Wine' | 'Dessert Wine' | 'Fortified Wine' | 'Gin' | 'Shooter' | 'RTD' | 'Canned Wines' | 'Brandy' | 'Bitters';

export interface ParsedWineData {
  wines: Wine[];
  errors: string[];
}