import { Avatar } from '@/components/avatar';
import { LevelBar } from '@/components/level-bar';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileEditButton } from '@/components/profile/profile-edit-button';
import { ProfileWelcome } from '@/components/profile/profile-welcome';
import { ContrastSelect, LanguageSelect } from '@/ui';

export default function Profile() {
  return (
    <main className="relative flex-1 flex flex-col px-3 pt-32 overflow-x-clip overflow-y-clip">
      <ContrastSelect />
      <LanguageSelect />
      <div className="bg-white grow border-blue-100 relative border rounded-lg p-4 pt-24 flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <Avatar className="size-40 block rounded-full bg-blue-100" />
          <ProfileEditButton />
        </div>
        <ProfileWelcome />
        <LevelBar />
        <ProfileActions />
      </div>
    </main>
  );
}
