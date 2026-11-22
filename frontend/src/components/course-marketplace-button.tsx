'use client';

import { CourseMarketplaceModal } from '@/components/course-marketplace-modal';
import { Button } from '@/ui';
import { useState } from 'react';

export const CourseMarketplaceButton = () => {
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setMarketplaceOpen(true)}>
        See all
      </Button>
      <CourseMarketplaceModal open={marketplaceOpen} onOpenChange={setMarketplaceOpen} />
    </>
  );
};
