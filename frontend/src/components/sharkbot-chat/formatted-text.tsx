import React from 'react';

/** Renders `**bold**` fragments of a single line without using raw HTML. */
const renderInline = (line: string) =>
  line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part.replace(/[*`]/g, '')}</React.Fragment>
    ),
  );

/**
 * Minimal Markdown-like renderer for bot replies:
 * headings (#), bullet lists (-, *, •), quotes (>) and **bold**.
 */
export const FormattedText = ({ text }: { text: string }) => {
  const lines = text.split('\n');

  return (
    <div className="flex flex-col gap-1.5 text-sm leading-relaxed">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
          return <hr key={i} className="my-1 border-blue-100" />;
        }

        const heading = line.match(/^#{1,6}\s+(.*)$/);
        if (heading) {
          return (
            <p key={i} className="font-semibold text-blue-950">
              {renderInline(heading[1])}
            </p>
          );
        }

        const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
        if (bullet) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-500" />
              <span>{renderInline(bullet[1])}</span>
            </p>
          );
        }

        const quote = line.match(/^>\s?(.*)$/);
        if (quote) {
          return (
            <p key={i} className="border-l-2 border-blue-100 pl-3 text-grey-600 italic">
              {renderInline(quote[1])}
            </p>
          );
        }

        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
};
