'use client';

import { AvatarHat, useAvatar } from '@/components/avatar/avatar-context';
import clsx from 'clsx';
import Image from 'next/image';

type AvatarProps = React.HTMLAttributes<HTMLElement> & {
  hat?: AvatarHat;
};

export const Avatar = ({ className, hat, ...props }: AvatarProps) => {
  const { selectedHat } = useAvatar();
  const visibleHat = hat ?? selectedHat;

  return (
    <section className={clsx('relative isolate overflow-hidden', className)} {...props}>
      <Image src="/img/avatar/avatar-base.svg" alt="Avatar" width={400} height={400} className="h-full w-full" />
      <Image
        src={`/img/avatar/hat-${visibleHat}.svg`}
        alt=""
        width={400}
        height={400}
        className="absolute inset-0 z-10 h-full w-full"
      />
    </section>
  );
};
