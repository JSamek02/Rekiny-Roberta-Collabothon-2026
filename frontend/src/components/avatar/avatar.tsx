'use client';

import { AvatarHat, useAvatar } from '@/components/avatar/avatar-context';
import clsx from 'clsx';
import Image from 'next/image';

type AvatarProps = React.HTMLAttributes<HTMLElement> & {
  hat?: AvatarHat;
};

type AvatarImageProps = {
  className?: string;
};

export const AvatarBaseImage = ({ className }: AvatarImageProps) => (
  <Image
    src="/img/avatar/avatar-base.svg"
    alt="Avatar"
    width={400}
    height={400}
    className={clsx('h-full w-full', className)}
  />
);

export const AvatarHatImage = ({ hat, className }: AvatarImageProps & { hat: AvatarHat }) => (
  <Image
    src={`/img/avatar/hat-${hat}.svg`}
    alt=""
    width={400}
    height={400}
    className={clsx('h-full w-full', className)}
  />
);

export const Avatar = ({ className, hat, ...props }: AvatarProps) => {
  const { selectedHat } = useAvatar();
  const visibleHat = hat ?? selectedHat;

  return (
    <section className={clsx('relative isolate overflow-hidden', className)} {...props}>
      <AvatarBaseImage />
      <AvatarHatImage hat={visibleHat} className="absolute inset-0 z-10" />
    </section>
  );
};
