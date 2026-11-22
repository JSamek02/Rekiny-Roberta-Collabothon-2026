'use client';

import { createContext, useContext, useState } from 'react';
import type { AvatarHat } from '@/components/avatar';

type ShopContextValue = {
  boughtHats: AvatarHat[];
  buyHat: (hat: AvatarHat) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [boughtHats, setBoughtHats] = useState<AvatarHat[]>([1, 2, 3]);

  const buyHat = (hat: AvatarHat) => {
    setBoughtHats((current) => (current.includes(hat) ? current : [...current, hat].sort()));
  };

  return (
    <ShopContext.Provider value={{ boughtHats, buyHat }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within ShopProvider');
  return context;
};
