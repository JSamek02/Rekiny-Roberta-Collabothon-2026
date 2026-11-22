'use client';

import { CourseMarketplaceModal } from '@/components/course-marketplace-modal';
import { Button } from '@/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export const CourseMarketplaceButton = () => {
  const t = useTranslations('components.course-marketplace');
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setMarketplaceOpen(true)}>
        {t('see-all')}
      </Button>
      <CourseMarketplaceModal open={marketplaceOpen} onOpenChange={setMarketplaceOpen} />
    </>
  );
};
