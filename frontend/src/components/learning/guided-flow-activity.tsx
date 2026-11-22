'use client';

import type { GuidedFlowArea, GuidedFlowContent } from '@/api/types/learning';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import Image from 'next/image';
import { type CSSProperties, useState } from 'react';

type GuidedFlowActivityProps = {
  content: GuidedFlowContent;
  completed: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  onBack: () => void;
};

const normaliseValue = (value: string) => value.trim().toLocaleLowerCase().replace(/,/g, '.');

const isInputComplete = (value: string, acceptedValues?: string[]) => {
  if (!value.trim()) return false;
  if (!acceptedValues?.length) return true;

  const normalisedValue = normaliseValue(value);
  return acceptedValues.some((acceptedValue) => normaliseValue(acceptedValue) === normalisedValue);
};

const GuidedFlowBackBar = ({ label, onBack }: { label: string; onBack: () => void }) => (
  <nav aria-label={label} className="rounded-2xl border border-blue-100 bg-white p-2">
    <button
      type="button"
      onClick={onBack}
      className="flex w-fit items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold text-blue-950 transition-colors hover:text-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <ArrowLeftIcon className="text-xl stroke-[1.5]" />
      {label}
    </button>
  </nav>
);

export const GuidedFlowActivity = ({
  content,
  completed,
  isCompleting,
  onComplete,
  onBack,
}: GuidedFlowActivityProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showInputWarning, setShowInputWarning] = useState(false);
  const frames = content.frames || [];
  const frame = frames[frameIndex];
  const isLastFrame = frameIndex === frames.length - 1;

  const positionStyle = (area: GuidedFlowArea): CSSProperties => ({
    left: `${(area.x / content.canvas.width) * 100}%`,
    top: `${(area.y / content.canvas.height) * 100}%`,
    width: `${(area.width / content.canvas.width) * 100}%`,
    height: `${(area.height / content.canvas.height) * 100}%`,
  });

  const frameInputsAreComplete = frame?.inputs?.every((input) => (
    isInputComplete(inputValues[input.id] || '', input.accepted_values)
  )) ?? true;

  const updateInputValue = (inputId: string, value: string) => {
    setInputValues((current) => ({ ...current, [inputId]: value }));
    setShowInputWarning(false);
  };

  const handleHitboxClick = () => {
    if (!frame || completed || isCompleting) return;

    if (!frameInputsAreComplete) {
      setShowInputWarning(true);
      return;
    }

    setShowInputWarning(false);
    if (isLastFrame) {
      onComplete();
      return;
    }

    setFrameIndex((current) => current + 1);
  };

  if (!frames.length) return null;

  if (completed) {
    return (
      <div role="status" className="rounded-2xl border border-green-500 bg-green-50 p-4">
        <p className="font-semibold text-green-800">{content.completion.title}</p>
        <p className="mt-1 text-sm text-green-800">{content.completion.description}</p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="flex flex-col gap-5">
        <GuidedFlowBackBar label={content.back_label} onBack={onBack} />
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-xl font-semibold text-blue-950">{content.intro.title}</h2>
          <p className="mt-2 text-sm leading-7 text-grey-600">{content.intro.description}</p>
          <button
            type="button"
            onClick={() => setHasStarted(true)}
            className="mt-5 w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {content.intro.start_label}
          </button>
        </div>
      </div>
    );
  }

  const instructionId = `guided-flow-${frame.id}-instruction`;
  const hintId = `guided-flow-${frame.id}-hint`;

  return (
    <div className="flex flex-col gap-5">
      <GuidedFlowBackBar label={content.back_label} onBack={onBack} />

      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-1 shadow-sm">
        <div
          className="relative isolate w-full overflow-hidden rounded-[1.75rem] bg-blue-950"
          style={{ aspectRatio: `${content.canvas.width} / ${content.canvas.height}` }}
        >
          {/* Mock frames are replaced in place, so they must bypass Next's URL-keyed image cache. */}
          <Image
            src={frame.image_url}
            alt={frame.alt}
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-contain"
            unoptimized
          />

          {frame.inputs?.map((input) => (
            <label key={input.id} className="absolute block" style={positionStyle(input)}>
              <span className="sr-only">{input.label}</span>
              {input.options ? (
                <select
                  value={inputValues[input.id] || ''}
                  aria-label={input.label}
                  aria-invalid={showInputWarning && !isInputComplete(inputValues[input.id] || '', input.accepted_values)}
                  onChange={(event) => updateInputValue(input.id, event.target.value)}
                  className="size-full rounded-[1.25rem] border-0 bg-[#dcf3df] px-[5%] text-[clamp(0.625rem,3vw,1rem)] text-blue-950 outline-none focus:ring-2 focus:ring-blue-950"
                >
                  <option value="" disabled>{input.placeholder}</option>
                  {input.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  inputMode={input.input_mode === 'decimal' ? 'decimal' : 'text'}
                  value={inputValues[input.id] || ''}
                  placeholder={input.placeholder}
                  aria-label={input.label}
                  aria-invalid={showInputWarning && !isInputComplete(inputValues[input.id] || '', input.accepted_values)}
                  onChange={(event) => updateInputValue(input.id, event.target.value)}
                  className="size-full rounded-md border-0 bg-transparent px-[3%] text-[clamp(0.625rem,3vw,1rem)] text-blue-950 outline-none placeholder:text-grey-400 focus:ring-2 focus:ring-blue-950"
                />
              )}
            </label>
          ))}

          <button
            type="button"
            aria-label={frame.hitbox.label}
            aria-describedby={`${instructionId} ${hintId}`}
            title={frame.hitbox.label}
            disabled={isCompleting}
            onClick={handleHitboxClick}
            style={positionStyle(frame.hitbox)}
            className="absolute cursor-pointer rounded bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950 disabled:cursor-wait"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p id={instructionId} className="font-semibold text-blue-950">{frame.quest}</p>
        <p id={hintId} className="mt-2 text-sm leading-6 text-grey-600">{frame.hint}</p>
        {showInputWarning && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">{content.incomplete_inputs_message}</p>
        )}
      </div>
    </div>
  );
};
