import React from 'react';
import { Building, MapPin, Phone, Mail, Globe, Upload } from 'lucide-react';
import { CompanyInfo } from '../types/wine';

interface CompanyBrandingProps {
  companyInfo: CompanyInfo;
  onCompanyInfoChange: (info: Partial<CompanyInfo>) => void;
}

export const CompanyBranding: React.FC<CompanyBrandingProps> = ({
  companyInfo,
  onCompanyInfoChange
}) => {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        onCompanyInfoChange({ logo: event.target?.result as string });
      };
      reader.onerror = () => {
        alert('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <Building className="h-5 w-5 text-burgundy-600" />
        Company Branding
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => onCompanyInfoChange({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <textarea
              value={companyInfo.address}
              onChange={(e) => onCompanyInfoChange({ address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
              placeholder="Enter company address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={companyInfo.phone}
              onChange={(e) => onCompanyInfoChange({ phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email Address
            </label>
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => onCompanyInfoChange({ email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
              placeholder="contact@yourwinery.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Website
            </label>
            <input
              type="url"
              value={companyInfo.website}
              onChange={(e) => onCompanyInfoChange({ website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
              placeholder="https://yourwinery.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            <div className="space-y-3">
              {companyInfo.logo && (
                <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <img
                    src={companyInfo.logo}
                    alt="Company Logo"
                    className="max-h-20 max-w-40 object-contain"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer bg-burgundy-600 hover:bg-burgundy-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {companyInfo.logo ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {companyInfo.logo && (
                  <button
                    onClick={() => onCompanyInfoChange({ logo: '' })}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supported: PNG, JPG, GIF. Max 2MB. Logo will be centered in preview and PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};