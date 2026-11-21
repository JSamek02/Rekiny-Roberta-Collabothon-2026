'use client';

import { ShopModal } from '@/components/shop/shop-modal';
import { Button } from '@/ui';
import { useState } from 'react';

export const ShopButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="md"
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full bg-amber-500 text-blue-950 hover:bg-amber-300"
      >
        Shop
      </Button>
      <ShopModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
