import { type ReactNode } from 'react';

type ActivityMessageProps = {
  message: string;
  action?: ReactNode;
};

export const ActivityMessage = ({ message, action }: ActivityMessageProps) => (
  <section className="mx-auto flex w-full max-w-2xl flex-col px-4 py-16 text-center text-sm text-grey-600">
    {message}
    {action}
  </section>
);
