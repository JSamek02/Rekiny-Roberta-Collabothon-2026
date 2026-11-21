'use client';

import { Link } from '@/i18n/navigation';
import { routes } from '@/utils/routes';
import { Lottie } from 'lottie-react';
import { useCallback, useRef } from 'react';
import sharkWaveAnimation from '../../../public/lottie/shark-wave.json';

// Robert's teeth are small white shapes in shark-wave.json; the belly is white too, but much larger.
const WHITE_FILL = /^rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)$/i;
const MAX_TOOTH_SIZE = 24; // animation units

type Anchor = { path: SVGPathElement; point: DOMPoint };

/**
 * Picks the top front tooth and returns its centre in the tooth path's own coordinates.
 * Only the body's position is animated (the shapes never rotate), so the same tooth is always on top.
 */
const findToothAnchor = (svg: SVGSVGElement): Anchor | null => {
  let best: { anchor: Anchor; y: number } | null = null;
  for (const path of svg.querySelectorAll('path')) {
    if (!WHITE_FILL.test(path.getAttribute('fill') ?? '')) continue;
    const box = path.getBBox();
    const matrix = path.getCTM();
    if (!matrix || box.width > MAX_TOOTH_SIZE || box.height > MAX_TOOTH_SIZE) continue;
    const point = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2);
    const { y } = point.matrixTransform(matrix);
    if (!best || y < best.y) best = { anchor: { path, point }, y };
  }
  return best?.anchor ?? null;
};

/**
 * The waving shark from the chatbot banner, with a tiny invisible hitbox on its teeth
 * that opens the hidden mini-game. The hitbox follows the animation frame by frame.
 */
export const SharkWaveEasterEgg = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const anchorRef = useRef<Anchor | null>(null);

  const placeHitbox = useCallback(() => {
    const svg = wrapperRef.current?.querySelector('svg');
    const link = linkRef.current;
    if (!svg || !link) return;
    if (!anchorRef.current?.path.isConnected) anchorRef.current = findToothAnchor(svg);
    const anchor = anchorRef.current;
    const matrix = anchor?.path.getCTM();
    if (!anchor || !matrix) return;

    // getCTM maps into the <svg> box, which fills the wrapper, so this is the wrapper's local space.
    const { x, y } = anchor.point.matrixTransform(matrix);
    link.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    link.style.visibility = 'visible';
  }, []);

  return (
    <div ref={wrapperRef} className="relative aspect-square scale-175 translate-x-8 translate-y-4">
      <Lottie
        src={sharkWaveAnimation}
        loop
        autoplay
        aria-hidden
        className="size-full"
        subscriptions={{ ready: placeHitbox, frame: placeHitbox }}
      />
      {/* Easter egg: hidden from assistive tech and keyboard on purpose. */}
      <Link
        ref={linkRef}
        href={routes.cakeGame}
        aria-hidden
        tabIndex={-1}
        className="invisible absolute top-0 left-0 size-3 rounded-full"
      />
    </div>
  );
};
