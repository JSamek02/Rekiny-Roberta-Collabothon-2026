import clsx from 'clsx';
import Image from 'next/image';

export const Avatar = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  return (
    <section className={clsx('relative isolate overflow-hidden', className)} {...props}>
      <Image src="/img/avatar/avatar-base.svg" alt="Avatar" width={400} height={400} className="w-full h-full" />
      <Image
        src="/img/avatar/hat-1.svg"
        alt=""
        width={400}
        height={400}
        className="w-full h-full absolute inset-0 z-10"
      />
    </section>
  );
};
