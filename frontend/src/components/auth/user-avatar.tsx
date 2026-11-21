import { AuthUser } from '@/api/types/auth';
import { UserIcon } from '@/icons/user';
import clsx from 'clsx';
import Image from 'next/image';

type UserAvatarProps = {
  user: AuthUser | null;
  className?: string;
};

/** Google profile picture, first letter of the name, or a generic icon for guests. */
export const UserAvatar = ({ user, className }: UserAvatarProps) => {
  const initial = (user?.name || user?.email || '').trim().charAt(0).toUpperCase();

  return (
    <span
      className={clsx(
        'relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-blue-950',
        className,
      )}
    >
      {user?.picture ? (
        // Google avatars are external URLs; skip the optimizer so no remote host config is needed.
        <Image src={user.picture} alt="" fill unoptimized referrerPolicy="no-referrer" className="object-cover" />
      ) : initial ? (
        <span className="font-semibold">{initial}</span>
      ) : (
        <UserIcon className="text-xl stroke-[1.5]" />
      )}
    </span>
  );
};
