'use client';

import { createContext, useContext, useState } from 'react';

export const avatarHats = [1, 2, 3, 4] as const;
export type AvatarHat = (typeof avatarHats)[number];

type AvatarContextValue = {
  selectedHat: AvatarHat;
  setSelectedHat: (hat: AvatarHat) => void;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedHat, setSelectedHat] = useState<AvatarHat>(1);

  return (
    <AvatarContext.Provider value={{ selectedHat, setSelectedHat }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) throw new Error('useAvatar must be used within AvatarProvider');
  return context;
};
