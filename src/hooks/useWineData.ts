import { useState, useEffect } from 'react';
import { Wine, CompanyInfo, WineListConfig } from '../types/wine';

export const useWineData = () => {
  const [wines, setWines] = useState<Wine[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: ''
  });
  const [savedConfigs, setSavedConfigs] = useState<WineListConfig[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string>('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedWines = localStorage.getItem('wines');
    const savedCompany = localStorage.getItem('companyInfo');
    const savedConfigsList = localStorage.getItem('savedConfigs');

    if (savedWines) {
      setWines(JSON.parse(savedWines));
    }
    if (savedCompany) {
      setCompanyInfo(JSON.parse(savedCompany));
    }
    if (savedConfigsList) {
      setSavedConfigs(JSON.parse(savedConfigsList));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wines', JSON.stringify(wines));
  }, [wines]);

  useEffect(() => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs));
  }, [savedConfigs]);

  const updateWines = (newWines: Wine[]) => {
    setWines(newWines);
  };

  const toggleWineSelection = (wineId: string) => {
    setWines(wines.map(wine => 
      wine.id === wineId 
        ? { ...wine, selected: !wine.selected }
        : wine
    ));
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setCompanyInfo(prev => ({ ...prev, ...info }));
  };

  const saveConfiguration = (name: string) => {
    const config: WineListConfig = {
      id: Date.now().toString(),
      name,
      companyInfo,
      selectedWines: wines.filter(wine => wine.selected),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSavedConfigs(prev => [...prev, config]);
    setCurrentConfigId(config.id);
  };

  const loadConfiguration = (configId: string) => {
    const config = savedConfigs.find(c => c.id === configId);
    if (config) {
      setCompanyInfo(config.companyInfo);
      setWines(prev => prev.map(wine => ({
        ...wine,
        selected: config.selectedWines.some(sw => sw.id === wine.id)
      })));
      setCurrentConfigId(configId);
    }
  };

  const deleteConfiguration = (configId: string) => {
    setSavedConfigs(prev => prev.filter(c => c.id !== configId));
    if (currentConfigId === configId) {
      setCurrentConfigId('');
    }
  };

  const addWine = (wine: Omit<Wine, 'id' | 'selected'>) => {
    const newWine: Wine = {
      ...wine,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      selected: false
    };
    setWines(prev => [...prev, newWine]);
  };

  const deleteWine = (wineId: string) => {
    setWines(prev => prev.filter(wine => wine.id !== wineId));
  };

  const updateWine = (wineId: string, updates: Partial<Wine>) => {
    setWines(prev => prev.map(wine =>
      wine.id === wineId ? { ...wine, ...updates } : wine
    ));
  };

  return {
    wines,
    companyInfo,
    savedConfigs,
    currentConfigId,
    updateWines,
    toggleWineSelection,
    updateCompanyInfo,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    addWine,
    deleteWine,
    updateWine
  };
};