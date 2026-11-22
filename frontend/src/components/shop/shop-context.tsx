'use client';

import { createContext, useContext, useState } from 'react';
import type { AvatarHat } from '@/components/avatar';

type ShopContextValue = {
  boughtHats: AvatarHat[];
  buyHat: (hat: AvatarHat) => void;
  starredCourses: string[];
  toggleStarredCourse: (course: string) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [boughtHats, setBoughtHats] = useState<AvatarHat[]>([1, 2, 3]);
  const [starredCourses, setStarredCourses] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['stocks-bonds', 'investing', 'budgeting', 'economics'];
    const saved = window.localStorage.getItem('starred-courses');
    if (!saved) return ['stocks-bonds', 'investing', 'budgeting', 'economics'];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : ['stocks-bonds', 'investing', 'budgeting', 'economics'];
    } catch {
      return ['stocks-bonds', 'investing', 'budgeting', 'economics'];
    }
  });

  const buyHat = (hat: AvatarHat) => {
    setBoughtHats((current) => (current.includes(hat) ? current : [...current, hat].sort()));
  };

  const toggleStarredCourse = (course: string) => {
    setStarredCourses((current) => {
      const next = current.includes(course)
        ? current.filter((key) => key !== course)
        : [...current, course];
      window.localStorage.setItem('starred-courses', JSON.stringify(next));
      return next;
    });
  };

  return (
    <ShopContext.Provider value={{ boughtHats, buyHat, starredCourses, toggleStarredCourse }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within ShopProvider');
  return context;
};
