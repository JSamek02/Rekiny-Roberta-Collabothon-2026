import { useEffect, useState } from 'react';

export const useHydrated = (): boolean => {
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  return isHydrated;
};
