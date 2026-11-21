import { Avatar } from '@/components/avatar';
import { LevelBar } from '@/components/level-bar';
import { RichText } from '@/components/rich-text/rich-text';
import { EditIcon } from '@/icons/edit';
import { getTranslations } from 'next-intl/server';

export default async function Profile() {
  const t = await getTranslations('pages.profile');

  return (
    <main className="flex-1 flex flex-col px-3 pt-32 overflow-x-clip overflow-y-clip">
      <div className="bg-white grow border-blue-100 relative border rounded-lg p-4 pt-24">
        <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <Avatar className="size-40 block rounded-full bg-blue-100" />
          <button className="bg-blue-500 size-10 rounded-full flex justify-center items-center absolute bottom-0 right-0">
            <EditIcon className="text-white stroke-2 text-xl" />
          </button>
        </div>
        <h2 className="text-center text-base [&_span]:text-2xl font-medium">
          <RichText>{(tags) => t.rich('heading', { ...tags, name: 'Rekin Robert' })}</RichText>
        </h2>
        <LevelBar />
      </div>
    </main>
  );
}
