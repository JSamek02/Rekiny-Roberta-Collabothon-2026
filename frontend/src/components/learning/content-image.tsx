import { ContentImage as ContentImageData } from '@/api/types/learning';

/* eslint-disable @next/next/no-img-element -- authored content may use different image hosts. */

type ContentImageProps = {
  image: ContentImageData;
  className?: string;
};

const isSupportedImageUrl = (url: string) => (url.startsWith('/') && !url.startsWith('//')) || /^https?:\/\//i.test(url);

export const ContentImage = ({ image, className = '' }: ContentImageProps) => {
  if (!image?.url || !isSupportedImageUrl(image.url)) {
    return null;
  }

  return (
    <figure className={`overflow-hidden rounded-2xl border border-blue-100 bg-white ${className}`}>
      <img src={image.url} alt={image.alt || ''} className="h-auto max-h-80 w-full object-contain" loading="lazy" />
      {image.caption && <figcaption className="px-3 py-2 text-xs text-grey-600">{image.caption}</figcaption>}
    </figure>
  );
};
