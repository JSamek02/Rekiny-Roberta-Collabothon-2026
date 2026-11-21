'use client';

import { PersonalizationModal } from '@/components/personalization-modal';
import { EditIcon } from '@/icons/edit';
import { Button } from '@/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export const ProfileEditButton = () => {
  const t = useTranslations('pages.profile');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="iconSm"
        aria-label={t('edit-personalization')}
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-0 right-0 size-10 rounded-full"
      >
        <EditIcon className="text-white stroke-2 text-xl" />
      </Button>

      <PersonalizationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      />
    </>
  );
};
