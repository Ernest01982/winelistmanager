import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      product_prices: {
        Row: {
          id: string;
          brand: string | null;
          area: string | null;
          product_name: string;
          case: number | null;
          size: string | null;
          exv_per_case: number | null;
          exv_per_unit: number | null;
          exv_per_case_2: number | null;
          inv_per_unit: number | null;
          source_file: string | null;
          row_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand?: string | null;
          area?: string | null;
          product_name: string;
          case?: number | null;
          size?: string | null;
          exv_per_case?: number | null;
          exv_per_unit?: number | null;
          exv_per_case_2?: number | null;
          inv_per_unit?: number | null;
          source_file?: string | null;
          row_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string | null;
          area?: string | null;
          product_name?: string;
          case?: number | null;
          size?: string | null;
          exv_per_case?: number | null;
          exv_per_unit?: number | null;
          exv_per_case_2?: number | null;
          inv_per_unit?: number | null;
          source_file?: string | null;
          row_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      upsert_product_prices: {
        Args: {
          rows: any;
        };
        Returns: void;
      };
    };
  };
};