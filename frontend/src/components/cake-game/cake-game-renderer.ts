import { GameState, playerTop } from './cake-game-engine';
import { Sprites } from './cake-game-sprites';

export type ScorePopup = { x: number; y: number; text: string; age: number };

const POPUP_LIFETIME = 0.7; // s

export const updatePopups = (popups: ScorePopup[], dt: number) =>
  popups.filter((p) => (p.age += dt) < POPUP_LIFETIME);

const drawBackground = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const { width, height, elapsed } = state;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#ebefff');
  sky.addColorStop(1, '#d6f1fa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Gentle waves at the bottom, using the palette of the app's wave illustrations.
  const waves = [
    { color: '#b9e4fa', offset: 46, amplitude: 6, speed: 1.2 },
    { color: '#7dcafd', offset: 26, amplitude: 5, speed: -1.6 },
  ];
  for (const wave of waves) {
    ctx.fillStyle = wave.color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      ctx.lineTo(x, height - wave.offset + Math.sin(x / 28 + elapsed * wave.speed) * wave.amplitude);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }
};

export const drawGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  sprites: Sprites | null,
  popups: ScorePopup[],
  /** Canvas cannot resolve CSS variables, so the resolved font family is passed in. */
  fontFamily = 'sans-serif',
) => {
  drawBackground(ctx, state);
  if (!sprites) return;

  for (const item of state.items) {
    const sprite = sprites[item.kind];
    const height = (item.size * sprite.naturalHeight) / sprite.naturalWidth;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.kind === 'mine' ? Math.sin(item.rotation) * 0.25 : item.rotation);
    ctx.drawImage(sprite, -item.size / 2, -height / 2, item.size, height);
    ctx.restore();
  }

  const { player } = state;
  ctx.drawImage(sprites.player, player.x - player.width / 2, playerTop(state), player.width, player.height);

  ctx.textAlign = 'center';
  ctx.font = `600 16px ${fontFamily}`;
  for (const popup of popups) {
    const progress = popup.age / POPUP_LIFETIME;
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = '#3b5cff';
    ctx.fillText(popup.text, popup.x, popup.y - progress * 36);
  }
  ctx.globalAlpha = 1;
};
