'use client';

import { useViewer } from '@/components/auth';
import { RichText } from '@/components/rich-text/rich-text';
import { useTranslations } from 'next-intl';

export function ProfileWelcome() {
  const { user } = useViewer();
  const t = useTranslations('pages.profile');
  const authT = useTranslations('components.auth');
  const name = user?.name?.trim() || authT(user ? 'no-name' : 'roles.guest');

  return (
    <h2 className="text-center text-base [&_span]:text-2xl font-medium">
      <RichText>{(tags) => t.rich('heading', { ...tags, name })}</RichText>
    </h2>
  );
}
