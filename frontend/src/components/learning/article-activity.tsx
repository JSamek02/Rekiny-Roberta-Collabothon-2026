import { ArticleContent } from '@/api/types/learning';
import { ContentImage } from './content-image';

type ArticleActivityProps = {
  content: ArticleContent;
};

const imageLine = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/;

export const ArticleActivity = ({ content }: ArticleActivityProps) => {
  const blocks = (content.markdown || '').trim().split(/\n\s*\n/).filter(Boolean);

  return (
    <article className="flex flex-col gap-5">
      {content.image && <ContentImage image={content.image} />}
      {blocks.map((block, index) => {
        const lines = block.split('\n').filter(Boolean);
        const image = lines.length === 1 ? imageLine.exec(lines[0]) : null;

        if (image) {
          return (
            <ContentImage
              key={`${image[2]}-${index}`}
              image={{ url: image[2], alt: image[1], caption: image[3] }}
            />
          );
        }

        if (lines.length === 1 && lines[0].startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-blue-950">{lines[0].slice(3)}</h2>;
        }

        if (lines.length === 1 && lines[0].startsWith('# ')) {
          return <h2 key={index} className="text-2xl font-semibold text-blue-950">{lines[0].slice(2)}</h2>;
        }

        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-sm leading-7 text-grey-600">
              {lines.map((line) => <li key={line}>{line.slice(2)}</li>)}
            </ul>
          );
        }

        return <p key={index} className="text-sm leading-7 text-grey-600">{lines.join(' ')}</p>;
      })}
    </article>
  );
};
