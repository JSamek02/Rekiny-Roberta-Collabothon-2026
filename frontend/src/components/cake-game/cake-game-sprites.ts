import { ItemKind } from './cake-game-engine';

export type SpriteKey = ItemKind | 'player';
export type Sprites = Record<SpriteKey, HTMLImageElement>;

const SPRITE_URLS: Record<SpriteKey, string> = {
  player: '/img/shark.svg',
  cake: '/img/kremowka.svg',
  coin: '/img/SharkCoin.svg',
  mine: '/img/sea-mine.svg',
};

/**
 * Some project SVGs use `width="100%"`, which leaves them without an intrinsic size;
 * browsers (notably Firefox) then refuse to draw them on a canvas. Give the root element
 * the pixel size of its viewBox and load it from a blob URL instead.
 */
const withIntrinsicSize = (svg: string) => {
  const rootTag = svg.match(/<svg\b[^>]*>/)?.[0];
  const viewBox = rootTag?.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
  if (!rootTag || !viewBox) return svg;
  const sized = rootTag
    .replace(/\swidth="[^"]*"/, '')
    .replace(/\sheight="[^"]*"/, '')
    .replace('<svg', `<svg width="${viewBox[1]}" height="${viewBox[2]}"`);
  return svg.replace(rootTag, sized);
};

const loadSprite = async (url: string, objectUrls: string[]) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  const blob = new Blob([withIntrinsicSize(await response.text())], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);
  objectUrls.push(objectUrl);
  const image = new Image();
  image.src = objectUrl;
  await image.decode();
  return image;
};

/** Loads every sprite. Call `release()` when the game unmounts to free the blob URLs. */
export const loadSprites = async () => {
  const objectUrls: string[] = [];
  const entries = await Promise.all(
    (Object.keys(SPRITE_URLS) as SpriteKey[]).map(async (key) => [key, await loadSprite(SPRITE_URLS[key], objectUrls)] as const),
  );
  return {
    sprites: Object.fromEntries(entries) as Sprites,
    release: () => objectUrls.forEach((u) => URL.revokeObjectURL(u)),
  };
};
