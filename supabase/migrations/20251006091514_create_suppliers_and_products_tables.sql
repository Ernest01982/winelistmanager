/*
  # Create Suppliers and Products Management System

  ## Overview
  This migration creates a complete supplier and product management system with proper relationships
  and security policies.

  ## New Tables
  
  ### `suppliers`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, not null) - Supplier/vendor name
  - `contact_person` (text) - Primary contact person
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone number
  - `address` (text) - Physical address
  - `notes` (text) - Additional notes about supplier
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `products`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, not null) - Product name
  - `description` (text) - Product description
  - `category` (text, not null) - Product category (Red Wine, White Wine, etc.)
  - `vintage` (text) - Vintage year
  - `price` (numeric, not null) - Retail price
  - `region` (text) - Wine region/origin
  - `varietal` (text) - Grape varietal
  - `supplier_id` (uuid, foreign key) - References suppliers table
  - `selected` (boolean, default false) - Whether selected for wine list
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on both tables
  - Public read access for suppliers (for dropdowns/selection)
  - Public full access for products (allowing anonymous users to manage products)
  - This is appropriate for a single-tenant application without auth

  ## Important Notes
  1. No authentication required - suitable for internal tool use
  2. Supplier deletion is restricted if products reference them
  3. All timestamps automatically managed
  4. Proper indexes for performance on foreign keys and lookups
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Red Wine',
  vintage text DEFAULT '',
  price numeric(10, 2) NOT NULL,
  region text DEFAULT '',
  varietal text DEFAULT '',
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_selected ON products(selected);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers table
-- Allow public read access (for dropdowns and selection)
CREATE POLICY "Public can view suppliers"
  ON suppliers FOR SELECT
  TO public
  USING (true);

-- Allow public insert access
CREATE POLICY "Public can insert suppliers"
  ON suppliers FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Public can update suppliers"
  ON suppliers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete access (will be restricted by foreign key constraint)
CREATE POLICY "Public can delete suppliers"
  ON suppliers FOR DELETE
  TO public
  USING (true);

-- Create policies for products table
-- Allow public read access
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  TO public
  USING (true);

-- Allow public insert access
CREATE POLICY "Public can insert products"
  ON products FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Public can update products"
  ON products FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Public can delete products"
  ON products FOR DELETE
  TO public
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
