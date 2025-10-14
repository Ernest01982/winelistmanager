# WineList Manager

A comprehensive wine list management system for restaurants, wine bars, and retailers. Create, manage, and export professional wine lists with ease.

## Features

### 1. File Upload & Import
- **CSV/Excel Import**: Upload wine inventory from spreadsheet files
- **Flexible Column Mapping**: Automatically detects common column names (name, price, category, vintage, region, varietal, supplier)
- **Data Validation**: Real-time validation with error reporting
- **Pricing Intelligence**: Supports multiple price formats (ExV per unit, InV per unit, wholesale, retail)

### 2. Supplier Management
- **Full Supplier CRUD**: Add, edit, and delete suppliers/vendors
- **Contact Management**: Store contact person, email, phone, address, and notes
- **Product Tracking**: View product count per supplier
- **Protected Deletion**: Prevents deletion of suppliers with associated products
- **Database Integration**: All supplier data persisted to Supabase

### 3. Product Management
- **Complete Product Database**: Manage all wine/beverage inventory
- **Supplier Association**: Link products to suppliers with dropdown selection
- **Quick-Add Supplier**: Add new suppliers without leaving the product form
- **Rich Product Details**: Name, description, category, vintage, price, region, varietal
- **Search & Filter**: Search across all product fields
- **Supabase Backend**: Full database persistence with real-time updates

### 4. Product Selection (Hierarchical)
- **Dual View Modes**:
  - **By Supplier**: Hierarchical view (Supplier → Category → Products)
  - **By Category**: Flat category view with supplier info
- **Collapsible Sections**: Expand/collapse suppliers and categories
- **Selection Management**: Click to select/deselect products for wine list
- **Visual Indicators**: Checkboxes and count badges show selection status
- **Real-time Sync**: All selections saved to database immediately
- **Smart Search**: Filter products across all fields

### 5. Company Branding
- **Company Information**: Name, address, phone, email, website
- **Logo Upload**: Add company logo to wine lists
- **Customization**: Personalize wine list appearance

### 6. Preview & Export
- **Live Preview**: See exactly how your wine list will look
- **Export Formats**:
  - PDF (professional layout with company branding)
  - Excel (structured data for analysis)
  - CSV (universal format for sharing)
- **Configuration Management**: Save and load different wine list configurations

### 7. Category Management
Supports comprehensive beverage categories:
- Red Wine
- White Wine
- Sparkling Wine
- Rosé Wine
- Dessert Wine
- Fortified Wine
- Gin
- Shooter
- RTD (Ready to Drink)
- Canned Wines (with smart mapping for "Vinette", "Vinnete", "Can")
- Brandy
- Bitters

### 8. Pricing Upload (Advanced)
- **Bulk Pricing Import**: Upload pricing sheets from suppliers
- **Preview & Validation**: Review data before importing
- **Error Handling**: Clear feedback on validation issues

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons

### Backend & Database
- **Supabase** for backend services
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
- **Database Schema**:
  - `suppliers` table: Vendor/supplier information
  - `products` table: Wine/beverage inventory with supplier relationships
  - Foreign key constraints and indexes for data integrity

### File Processing
- **Papa Parse**: CSV file parsing
- **XLSX**: Excel file processing
- **jsPDF**: PDF generation

### State Management
- React Hooks (useState, useEffect, useMemo)
- Custom hooks for data management
- Local storage for configuration persistence

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd winelistmanager
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Database Setup:
The database migration is already included in the project. The tables will be created automatically when you first run the application.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage Guide

### Workflow

1. **Setup Suppliers**
   - Navigate to "Suppliers" tab
   - Add your wine suppliers/vendors with contact information
   - Manage existing suppliers as needed

2. **Import or Add Products**
   - **Option A - File Upload**: Use "Upload" tab to import from CSV/Excel
   - **Option B - Manual Entry**: Use "Products" tab to add products one by one
   - Associate each product with a supplier
   - Assign appropriate categories

3. **Select Products for Wine List**
   - Go to "Selection" tab
   - Choose view mode (By Supplier or By Category)
   - Expand sections and click products to select them
   - Selected products will be included in your wine list

4. **Configure Branding**
   - Navigate to "Branding" tab
   - Enter your company information
   - Upload logo (optional)

5. **Preview & Export**
   - Check "Preview" tab to see your wine list
   - Go to "Export" tab to generate PDF, Excel, or CSV
   - Save configurations for different wine lists

### File Upload Format

Your CSV/Excel file should include these columns (flexible column names):
- **Name** (required): Product name
- **Price** (required): Price in any format (R123.45, 123,45, etc.)
- **Category**: Wine type (Red Wine, White Wine, etc.)
- **Vintage**: Year
- **Region**: Wine region/origin
- **Varietal**: Grape variety
- **Supplier**: Supplier name (will be matched/created)
- **Description**: Tasting notes or details

Example:
```csv
Name,Price,Category,Vintage,Region,Varietal,Supplier
Château Example,R245.00,Red Wine,2019,Bordeaux,Cabernet Sauvignon,Wine Imports SA
```

## Database Schema

### Suppliers Table
```sql
- id (uuid, primary key)
- name (text, not null)
- contact_person (text)
- email (text)
- phone (text)
- address (text)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Products Table
```sql
- id (uuid, primary key)
- name (text, not null)
- description (text)
- category (text, not null)
- vintage (text)
- price (numeric, not null)
- region (text)
- varietal (text)
- supplier_id (uuid, foreign key to suppliers)
- selected (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)
```

## Key Features Explained

### Smart Category Mapping
The system automatically maps uploaded categories to standard categories:
- "Vinette" → "Canned Wines"
- "MCC" → "Sparkling Wine"
- "Port" → "Fortified Wine"
- And many more variations

### Hierarchical Product Selection
View your inventory organized by supplier and category:
```
Supplier A
  ├── Red Wine
  │   ├── Product 1
  │   └── Product 2
  └── White Wine
      └── Product 3

Supplier B
  └── Sparkling Wine
      └── Product 4
```

### Real-time Database Sync
All operations (add, edit, delete, select) are immediately synced to Supabase:
- No data loss
- Multi-user ready
- Consistent state across sessions

### Row Level Security (RLS)
Database tables are protected with RLS policies:
- Public access enabled for single-tenant use
- Easily adaptable for multi-tenant with authentication
- Data integrity enforced at database level

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, dialogs, etc.)
│   ├── CompanyBranding.tsx
│   ├── ExportOptions.tsx
│   ├── FileUpload.tsx
│   ├── WinePreview.tsx
│   └── WineSelection.tsx (legacy)
├── pages/              # Page components
│   ├── PricingUpload.tsx
│   ├── ProductManagement.tsx
│   ├── ProductSelection.tsx
│   └── SupplierManagement.tsx
├── hooks/              # Custom React hooks
│   └── useWineData.ts
├── lib/                # Utilities and configurations
│   ├── supabase.ts
│   ├── offlineQueue.ts
│   └── utils.ts
├── types/              # TypeScript type definitions
│   ├── wine.ts
│   ├── supplier.ts
│   └── pricing.ts
├── utils/              # Helper functions
│   ├── excelParser.ts
│   ├── exportUtils.ts
│   ├── fileParser.ts
│   ├── productUpload.ts
│   └── templateGenerator.ts
└── App.tsx             # Main application component
```

## Troubleshooting

### Supabase Connection Issues
- Verify `.env` file has correct credentials
- Check Supabase project is active
- Ensure RLS policies are enabled

### File Upload Errors
- Check file format (CSV or Excel only)
- Ensure required columns exist (Name, Price)
- Verify price format is recognizable

### Products Not Appearing
- Check if products are saved to database (Products tab)
- Verify supplier associations
- Try refreshing the page

## Future Enhancements

- [ ] Multi-user authentication with role-based access
- [ ] Advanced pricing strategies (markups, discounts)
- [ ] Inventory management and stock tracking
- [ ] Order management system
- [ ] Customer-facing digital menus with QR codes
- [ ] Analytics and reporting
- [ ] Integration with POS systems
- [ ] Wine pairing suggestions

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Acknowledgments

- Built with React and TypeScript
- Powered by Supabase
- UI components from Radix UI
- Icons from Lucide React
