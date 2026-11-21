import { ReactNode } from 'react';

// These tags are available
type Tag = 'br' | 'strong' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'ul' | 'li' | 'email';

type RichTextProps = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

export const RichText = ({ children }: RichTextProps): React.ReactNode => {
  return (
    <>
      {children({
        strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
        br: () => <br />,
        h1: (chunks: ReactNode) => <h1>{chunks}</h1>,
        h2: (chunks: ReactNode) => <h2>{chunks}</h2>,
        h3: (chunks: ReactNode) => <h3>{chunks}</h3>,
        h4: (chunks: ReactNode) => <h4>{chunks}</h4>,
        p: (chunks: ReactNode) => <p>{chunks}</p>,
        span: (chunks: ReactNode) => <span>{chunks}</span>,
        ul: (chunks: ReactNode) => <ul>{chunks}</ul>,
        li: (chunks: ReactNode) => <li>{chunks}</li>,
        email: (chunks: ReactNode) => <a href={`mailto:${String(chunks as string)}`}>{chunks}</a>,
      })}
    </>
  );
};
