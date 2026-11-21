'use client';

import {
  AvatarBaseImage,
  AvatarHatImage,
  avatarHats,
  useAvatar,
  type AvatarHat,
} from '@/components/avatar';
import {
  Button,
  CarouselRoot,
  CarouselSlide,
  CarouselSlides,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useCarousel,
} from '@/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const HAT_CAROUSEL_OPTIONS = {
  loop: true,
  slidesToScroll: 1,
};

type PersonalizationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

type HatCarouselProps = {
  selectedHat: AvatarHat;
  onSelectHat: (hat: AvatarHat) => void;
};

const HatCarouselControl = ({ direction }: { direction: 'previous' | 'next' }) => {
  const { api } = useCarousel();
  const isPrevious = direction === 'previous';

  return (
    <Button
      variant="ghost"
      size="iconSm"
      aria-label={isPrevious ? 'Previous hat' : 'Next hat'}
      onClick={() => (isPrevious ? api?.scrollPrev() : api?.scrollNext())}
    >
      {isPrevious ? (
        <ChevronLeft aria-hidden className="size-5" />
      ) : (
        <ChevronRight aria-hidden className="size-5" />
      )}
    </Button>
  );
};

const HatCarouselSync = ({ onSelectHat }: Pick<HatCarouselProps, 'onSelectHat'>) => {
  const { api } = useCarousel();

  useEffect(() => {
    if (!api) return;

    const updateSelection = () => {
      const hat = avatarHats[api.selectedScrollSnap()];
      if (hat !== undefined) onSelectHat(hat);
    };

    api.on('select', updateSelection);
    api.on('reInit', updateSelection);

    return () => {
      api.off('select', updateSelection);
      api.off('reInit', updateSelection);
    };
  }, [api, onSelectHat]);

  return null;
};

type PersonalizationContentProps = {
  selectedHat: AvatarHat;
  setSelectedHat: (hat: AvatarHat) => void;
  onSave: () => void;
  onCancel: () => void;
};

const PersonalizationContent = ({
  selectedHat,
  setSelectedHat,
  onSave,
  onCancel,
}: PersonalizationContentProps) => {
  const [draftHat, setDraftHat] = useState(selectedHat);
  const setDraftHatStable = useCallback((hat: AvatarHat) => setDraftHat(hat), []);
  const carouselOptions = useMemo(
    () => ({ ...HAT_CAROUSEL_OPTIONS, startIndex: selectedHat - 1 }),
    [selectedHat],
  );

  const save = () => {
    setSelectedHat(draftHat);
    onSave();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-blue-950">Personalization</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4 py-2">
        <CarouselRoot options={carouselOptions} autoplayOptions={{ playOnInit: false }}>
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <HatCarouselControl direction="previous" />
            <div className="relative size-48">
              <AvatarBaseImage className="absolute inset-0 z-0" />
              <CarouselSlides className="absolute inset-0 z-10 h-full w-full [--slide-gap:0px]">
                {avatarHats.map((hat) => (
                  <CarouselSlide key={hat} className="flex h-full items-center justify-center">
                    <AvatarHatImage hat={hat} className="h-full w-full" />
                  </CarouselSlide>
                ))}
              </CarouselSlides>
            </div>
            <HatCarouselControl direction="next" />
          </div>
          <div className="mt-3 text-center text-xs font-medium text-grey-600">
            Hat {draftHat} of {avatarHats.length}
          </div>
          <HatCarouselSync onSelectHat={setDraftHatStable} />
        </CarouselRoot>
      </div>

      <DialogFooter className="border-blue-100 bg-blue-50/70">
        <DialogClose asChild>
          <Button variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="solid" size="md" onClick={save}>
            Save
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
};

export const PersonalizationModal = ({
  open,
  onOpenChange,
  onSave,
  onCancel,
}: PersonalizationModalProps) => {
  const { selectedHat, setSelectedHat } = useAvatar();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <PersonalizationContent
          key={`${open}-${selectedHat}`}
          selectedHat={selectedHat}
          setSelectedHat={setSelectedHat}
          onSave={onSave}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
