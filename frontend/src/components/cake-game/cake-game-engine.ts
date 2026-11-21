/** Pure game logic for the hidden "catch the cakes" mini-game (no React, no DOM). */

export type ItemKind = 'cake' | 'coin' | 'mine';

export type FallingItem = {
  id: number;
  kind: ItemKind;
  x: number; // centre, px
  y: number; // centre, px
  size: number; // px
  speed: number; // px/s
  rotation: number; // rad
  spin: number; // rad/s
};

export type Player = {
  x: number; // centre, px
  width: number;
  height: number;
};

export type GameState = {
  width: number;
  height: number;
  elapsed: number; // s
  spawnTimer: number; // s until next spawn
  score: number;
  caught: { cake: number; coin: number };
  items: FallingItem[];
  player: Player;
  nextId: number;
  lives: number;
  over: boolean;
};

export type StepEvent =
  | { type: 'catch'; kind: Exclude<ItemKind, 'mine'>; points: number; healed: boolean }
  | { type: 'hit' } // a mine hit the shark
  | { type: 'miss' }; // a coin fell into the sea uncaught

export const MAX_LIVES = 3;

export const POINTS: Record<Exclude<ItemKind, 'mine'>, number> = { cake: 10, coin: 5 };

const ITEM_SIZE: Record<ItemKind, number> = { cake: 52, coin: 40, mine: 46 };
const PLAYER_ASPECT = 375 / 250; // shark.svg height / width

/** Difficulty curve: everything ramps up with elapsed time, with caps so the game stays fair. */
export const difficulty = (elapsed: number) => ({
  spawnInterval: Math.max(0.38, 1.05 - elapsed * 0.013),
  speed: Math.min(540, 160 + elapsed * 6.5),
  mineChance: Math.min(0.42, 0.16 + elapsed * 0.0055),
});

const playerWidthFor = (width: number) => Math.round(Math.min(96, Math.max(64, width * 0.22)));

export const createGame = (width: number, height: number): GameState => {
  const playerWidth = playerWidthFor(width);
  return {
    width,
    height,
    elapsed: 0,
    spawnTimer: 0.6,
    score: 0,
    caught: { cake: 0, coin: 0 },
    items: [],
    player: { x: width / 2, width: playerWidth, height: playerWidth * PLAYER_ASPECT },
    nextId: 1,
    lives: MAX_LIVES,
    over: false,
  };
};

/** Keeps the game consistent after the play area changes size (e.g. phone rotation). */
export const resizeGame = (state: GameState, width: number, height: number) => {
  const scaleX = state.width > 0 ? width / state.width : 1;
  state.width = width;
  state.height = height;
  state.player.width = playerWidthFor(width);
  state.player.height = state.player.width * PLAYER_ASPECT;
  state.player.x = clampPlayerX(state, state.player.x * scaleX);
  for (const item of state.items) item.x *= scaleX;
};

export const playerTop = (state: GameState) => state.height - state.player.height - 8;

export const clampPlayerX = (state: GameState, x: number) => {
  const half = state.player.width / 2;
  return Math.min(state.width - half, Math.max(half, x));
};

const spawnItem = (state: GameState, random: () => number) => {
  const { speed, mineChance } = difficulty(state.elapsed);
  const roll = random();
  const kind: ItemKind = roll < mineChance ? 'mine' : random() < 0.55 ? 'cake' : 'coin';
  const size = ITEM_SIZE[kind];
  state.items.push({
    id: state.nextId++,
    kind,
    x: size / 2 + random() * Math.max(0, state.width - size),
    y: -size,
    size,
    speed: speed * (0.85 + random() * 0.3),
    rotation: random() * Math.PI * 2,
    spin: (random() - 0.5) * (kind === 'mine' ? 1 : 3),
  });
};

/** The shark catches with its open mouth: the upper part of the sprite. */
const isCaught = (state: GameState, item: FallingItem) => {
  const top = playerTop(state);
  const halfWidth = state.player.width * 0.38;
  return (
    Math.abs(item.x - state.player.x) < halfWidth + item.size * 0.25 &&
    item.y > top - item.size * 0.2 &&
    item.y < top + state.player.height * 0.4
  );
};

/** Mines hurt on contact with the shark's body; the hitbox is a bit smaller than the sprite to feel fair. */
const hitsMine = (state: GameState, item: FallingItem) => {
  const top = playerTop(state) + state.player.height * 0.08;
  const left = state.player.x - state.player.width * 0.3;
  const right = state.player.x + state.player.width * 0.3;
  const bottom = state.height - 8;
  const radius = item.size * 0.36;
  const nearestX = Math.max(left, Math.min(item.x, right));
  const nearestY = Math.max(top, Math.min(item.y, bottom));
  return (item.x - nearestX) ** 2 + (item.y - nearestY) ** 2 < radius ** 2;
};

const loseLife = (state: GameState) => {
  state.lives = Math.max(0, state.lives - 1);
  if (state.lives === 0) state.over = true;
};

/** Advances the game by `dt` seconds. Mutates `state` and returns what happened this frame. */
export const stepGame = (state: GameState, dt: number, random: () => number = Math.random): StepEvent[] => {
  if (state.over) return [];
  const events: StepEvent[] = [];

  state.elapsed += dt;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnItem(state, random);
    state.spawnTimer = difficulty(state.elapsed).spawnInterval * (0.75 + random() * 0.5);
  }

  const remaining: FallingItem[] = [];
  for (const item of state.items) {
    item.y += item.speed * dt;
    item.rotation += item.spin * dt;

    if (item.kind === 'mine') {
      if (hitsMine(state, item)) {
        loseLife(state);
        events.push({ type: 'hit' });
        continue;
      }
    } else if (isCaught(state, item)) {
      const points = POINTS[item.kind];
      state.score += points;
      state.caught[item.kind] += 1;
      let healed = false;
      if (item.kind === 'cake' && state.lives < MAX_LIVES) {
        state.lives += 1;
        healed = true;
      }
      events.push({ type: 'catch', kind: item.kind, points, healed });
      continue;
    }

    if (item.y - item.size / 2 < state.height) {
      remaining.push(item);
    } else if (item.kind === 'coin') {
      loseLife(state);
      events.push({ type: 'miss' });
    }
  }
  state.items = remaining;
  return events;
};
