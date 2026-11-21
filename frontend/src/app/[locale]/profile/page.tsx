import { LevelBar } from '@/components/level-bar';
import { RichText } from '@/components/rich-text/rich-text';
import { getTranslations } from 'next-intl/server';

export default async function Profile() {
  const t = await getTranslations('pages.profile');

  return (
    <main className="flex-1 flex flex-col px-3 pt-32 overflow-x-clip overflow-y-clip">
      <div className="bg-white grow border-blue-100 relative border rounded-lg p-4 pt-24">
        <div className="size-40 block rounded-full bg-blue-100 absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2" />

        <h2 className="text-center text-base [&_span]:text-2xl font-medium">
          <RichText>{(tags) => t.rich('heading', { ...tags, name: 'Rekin Robert' })}</RichText>
        </h2>
        <LevelBar />
      </div>
    </main>
  );
}
