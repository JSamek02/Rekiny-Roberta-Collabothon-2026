'use client';

import { Link } from '@/i18n/navigation';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { Button, buttonVariants } from '@/ui';
import { routes } from '@/utils/routes';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSharkCoins } from '@/hooks/use-shark-coins';
import { clampPlayerX, createGame, GameState, MAX_LIVES, POINTS, resizeGame, stepGame } from './cake-game-engine';
import { drawGame, ScorePopup, updatePopups } from './cake-game-renderer';
import { loadSprites, Sprites } from './cake-game-sprites';

type Phase = 'loading' | 'error' | 'ready' | 'playing' | 'over';

const BEST_SCORE_KEY = 'shark-finance.cake-game.best';
const MAX_FRAME_DT = 0.05; // s; avoids huge jumps after the tab was in the background
const KEYBOARD_SPEED = 520; // px/s
const COIN_REWARD = 5; // SharkCoins credited to the account per caught coin

const readBestScore = () => {
  try {
    return Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
};

const saveBestScore = (score: number) => {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Best score is optional when storage is unavailable.
  }
};

export const CakeGame = () => {
  const t = useTranslations('components.cake-game');
  const { creditGameCoin } = useSharkCoins();
  const creditGameCoinRef = useRef(creditGameCoin);
  useEffect(() => {
    creditGameCoinRef.current = creditGameCoin;
  }, [creditGameCoin]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [caught, setCaught] = useState({ cake: 0, coin: 0 });

  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<Sprites | null>(null);
  const gameRef = useRef<GameState>(createGame(0, 0));
  const popupsRef = useRef<ScorePopup[]>([]);
  const targetXRef = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const fontRef = useRef('sans-serif');

  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawGame(ctx, gameRef.current, spritesRef.current, popupsRef.current, fontRef.current);
  }, []);

  // Load the sprites and the stored best score.
  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | undefined;
    loadSprites()
      .then((loaded) => {
        release = loaded.release;
        if (cancelled) return release();
        spritesRef.current = loaded.sprites;
        setBest(readBestScore());
        setPhase('ready');
        redraw();
      })
      .catch((err) => {
        console.error('[CakeGame] Could not load sprites:', err);
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
      release?.();
    };
  }, [redraw]);

  // Keep the canvas sharp and sized to its container.
  useEffect(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;
    fontRef.current = getComputedStyle(area).fontFamily || 'sans-serif';

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gameRef.current.width === 0) gameRef.current = createGame(width, height);
      else resizeGame(gameRef.current, width, height);
      redraw();
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [redraw]);

  const startGame = useCallback(() => {
    const { width, height } = gameRef.current;
    gameRef.current = createGame(width, height);
    popupsRef.current = [];
    targetXRef.current = null;
    setScore(0);
    setLives(MAX_LIVES);
    setCaught({ cake: 0, coin: 0 });
    setIsNewBest(false);
    setPhase('playing');
  }, []);

  // Keyboard: arrows / A-D to move, Enter or Space to start.
  useEffect(() => {
    const handle = (pressed: boolean) => (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') keysRef.current.left = pressed;
      else if (key === 'arrowright' || key === 'd') keysRef.current.right = pressed;
      else if (pressed && (key === 'enter' || key === ' ') && (phase === 'ready' || phase === 'over')) startGame();
      else return;
      targetXRef.current = null;
      e.preventDefault();
    };
    const onDown = handle(true);
    const onUp = handle(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase, startGame]);

  // Game loop, only while playing.
  useEffect(() => {
    if (phase !== 'playing') return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(MAX_FRAME_DT, (now - last) / 1000);
      last = now;
      if (document.hidden) return;

      const game = gameRef.current;
      const keys = keysRef.current;
      const direction = Number(keys.right) - Number(keys.left);
      if (direction !== 0) {
        game.player.x = clampPlayerX(game, game.player.x + direction * KEYBOARD_SPEED * dt);
      } else if (targetXRef.current !== null) {
        const target = clampPlayerX(game, targetXRef.current);
        game.player.x += (target - game.player.x) * Math.min(1, dt * 16);
      }

      const events = stepGame(game, dt);
      popupsRef.current = updatePopups(popupsRef.current, dt);
      for (const event of events) {
        if (event.type === 'catch') {
          popupsRef.current.push({ x: game.player.x, y: game.height - game.player.height, text: `+${event.points}`, age: 0 });
          setScore(game.score);
          if (event.kind === 'coin') creditGameCoinRef.current(COIN_REWARD);
        }
      }
      if (events.length > 0) setLives(game.lives);
      if (game.over) {
        cancelAnimationFrame(frame);
        setCaught({ ...game.caught });
        const previousBest = readBestScore();
        if (game.score > previousBest) {
          saveBestScore(game.score);
          setBest(game.score);
          setIsNewBest(true);
        }
        setPhase('over');
      }
      redraw();
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, redraw]);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    targetXRef.current = e.clientX - rect.left;
  };

  return (
    <main className="flex flex-1 flex-col gap-3 px-3 pt-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={routes.home}
          className={clsx(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit border-0 px-0 text-sm uppercase')}
        >
          <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
          <span>{t('back')}</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-950 sm:gap-2 sm:text-sm">
          <span className="flex items-center gap-0.5 rounded-full border border-blue-100 bg-white px-2 py-1" aria-label={t('lives', { lives })}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Image key={i} src={i < lives ? '/img/heart.svg' : '/img/heart-empty.svg'} alt="" width={20} height={20} />
            ))}
          </span>
          <span className="rounded-full border border-blue-100 bg-white px-2 py-1 sm:px-3">
            {t('score')}: {score}
          </span>
          <span className="rounded-full border border-blue-100 bg-white px-2 py-1 sm:px-3 text-grey-600">
            {t('best')}: {best}
          </span>
        </div>
      </div>

      <div
        ref={areaRef}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        className="relative min-h-105 flex-1 touch-none select-none overflow-hidden rounded-2xl border border-blue-100"
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label={t('title')} />

        {phase !== 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/70 p-4 backdrop-blur-xs">
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm">
              {phase === 'loading' && <p className="text-sm text-grey-600">{t('loading')}</p>}

              {phase === 'error' && (
                <>
                  <p className="text-sm text-[#b42318]">{t('load-error')}</p>
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                    {t('retry')}
                  </Button>
                </>
              )}

              {phase === 'ready' && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{t('kicker')}</p>
                    <h1 className="text-2xl font-semibold text-blue-950">{t('title')}</h1>
                  </div>
                  <p className="text-sm text-grey-600">{t('instructions')}</p>
                  <ul className="flex w-full justify-around text-xs font-semibold text-blue-950">
                    <li className="flex flex-col items-center gap-1">
                      <Image src="/img/kremowka.svg" alt="" width={36} height={36} />
                      {t('points', { points: POINTS.cake })}
                    </li>
                    <li className="flex flex-col items-center gap-1">
                      <Image src="/img/SharkCoin.svg" alt="" width={32} height={32} className="my-0.5" />
                      {t('points', { points: POINTS.coin })}
                    </li>
                    <li className="flex flex-col items-center gap-1 text-[#b42318]">
                      <Image src="/img/sea-mine.svg" alt="" width={36} height={36} />
                      {t('avoid')}
                    </li>
                  </ul>
                  <p className="text-xs text-grey-600">{t('controls')}</p>
                  <Button className="w-full" onClick={startGame}>
                    {t('start')}
                  </Button>
                </>
              )}

              {phase === 'over' && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#b42318]">{t('boom')}</p>
                    <h2 className="text-2xl font-semibold text-blue-950">{t('game-over')}</h2>
                  </div>
                  <p className="text-3xl font-semibold text-blue-500">{score}</p>
                  {isNewBest && (
                    <p className="rounded-full bg-[#fff3d1] px-3 py-1 text-xs font-semibold text-[#8a5a00]">{t('new-best')}</p>
                  )}
                  <p className="text-sm text-grey-600">{t('caught', { cakes: caught.cake, coins: caught.coin })}</p>
                  <div className="flex w-full gap-2">
                    <Link href={routes.home} className={clsx(buttonVariants({ variant: 'ghost' }), 'flex-1')}>
                      {t('back')}
                    </Link>
                    <Button className="flex-1" onClick={startGame}>
                      {t('play-again')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
