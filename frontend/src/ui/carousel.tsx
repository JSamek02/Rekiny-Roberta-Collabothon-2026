'use client';

import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import Autoplay, { AutoplayOptionsType } from 'embla-carousel-autoplay';
import useEmblaCarousel, { EmblaViewportRefType } from 'embla-carousel-react';
import React, { useMemo } from 'react';

type CarouselContextValue = {
  api?: EmblaCarouselType;
  carouselRef?: EmblaViewportRefType;
  perView?: 'auto' | number;
};

const CarouselContext = React.createContext<CarouselContextValue>({} as CarouselContextValue);

export const useCarousel = (): CarouselContextValue => {
  const carouselContext = React.useContext(CarouselContext);
  if (!carouselContext) throw new Error('useCarousel should be used within <Carousel>');

  return carouselContext;
};

type CarouselRootProps = {
  options?: EmblaOptionsType;
  autoplayOptions?: AutoplayOptionsType;
  children?: React.ReactNode;
};

/**
 * Carousel root component with context provider.\
 * Provides context for components such as CarouselButton, CarouselIndicators, CarouselSlides, CarouselSlide.
 *
 * Apply CSS variables to change specific styles:\
 * [--slide-gap] - defines gaps between slides
 *
 * @param options - use to change carousel behaviour
 * @link (https://www.embla-carousel.com)
 */
export const CarouselRoot = ({ options, autoplayOptions, children }: CarouselRootProps): React.ReactNode => {
  const [carouselRef, api] = useEmblaCarousel(options, [Autoplay(autoplayOptions)]);

  const contextValue = useMemo(
    () => ({
      api,
      carouselRef,
      perView: options?.slidesToScroll,
    }),
    [api, carouselRef, options],
  );

  return <CarouselContext.Provider value={contextValue}>{children}</CarouselContext.Provider>;
};

type CarouselSlideProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  autoWidth?: boolean;
};

/**
 * Carousel slide component with calculated width.\
 * Slide width is dependant on `autoWidth` property and carousel `slidesToScroll` options property.\
 * Requires context from Carousel component.\
 * Slottable
 *
 * @param autoWidth - If true, carousel slide width is calculated based on slidesToScroll. Disable to set custom `flex-basis` value
 */
export const CarouselSlide = ({
  asChild,
  children,
  className,
  style,
  autoWidth = true,
  ...rest
}: CarouselSlideProps): React.ReactNode => {
  const { perView } = useCarousel();

  const Comp = asChild ? Slot : 'div';

  const slideFlex = useMemo(() => {
    if (typeof perView === 'number') {
      return `0 0 ${100 / perView}%`;
    }
    if (autoWidth === false) {
      return undefined;
    }
    return '100%';
  }, [perView, autoWidth]);

  return (
    <Comp
      role="group"
      aria-roledescription="slide"
      className={clsx('pl-(--slide-gap)', className)}
      style={{ flex: slideFlex, ...style }}
      {...rest}
    >
      {children}
    </Comp>
  );
};

/**
 * Carousel Slides component that is a wrapper to array of CarouselSlide components.\
 * Requires context from Carousel component.
 */
export const CarouselSlides = ({ className, children }: React.HTMLAttributes<HTMLDivElement>): React.ReactNode => {
  const { carouselRef } = useCarousel();

  return (
    <div className={clsx('overflow-x-clip', className)} ref={carouselRef}>
      <div
        className="ml-[calc(-1*var(--slide-gap))] flex h-full active:cursor-grabbing"
        aria-roledescription="carousel"
      >
        {children}
      </div>
    </div>
  );
};
