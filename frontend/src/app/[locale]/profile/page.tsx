import { Avatar } from '@/components/avatar';
import { LevelBar } from '@/components/level-bar';
import { ProfileEditButton } from '@/components/profile/profile-edit-button';
import { ProfileLogoutButton } from '@/components/profile/profile-logout-button';
import { RichText } from '@/components/rich-text/rich-text';
import { ShopButton } from '@/components/shop';
import { getTranslations } from 'next-intl/server';

export default async function Profile() {
  const t = await getTranslations('pages.profile');

  return (
    <main className="flex-1 flex flex-col px-3 pt-32 overflow-x-clip overflow-y-clip">
      <div className="bg-white grow border-blue-100 relative border rounded-lg p-4 pt-24 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <Avatar className="size-40 block rounded-full bg-blue-100" />
          <ProfileEditButton />
        </div>
        <h2 className="text-center text-base [&_span]:text-2xl font-medium">
          <RichText>{(tags) => t.rich('heading', { ...tags, name: 'Rekin Robert' })}</RichText>
        </h2>
        <LevelBar />
        <ShopButton />
        <ProfileLogoutButton />
      </div>
    </main>
  );
}
