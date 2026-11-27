// Deterministic screenshot scenes behind ?shot=start|play|end|win.
// Each one plays the real rules forward from a fresh world, steered by an
// autopilot (jump the fences and ovens, dash through knife storms, hide in
// a haystack when Barnaby closes in), so the frame is what a real game
// looks like and the same seed always gives the same frame.
import { GROUND_Y, STEP, TURKEY } from './config.js';
import { EVENT_CAUGHT, EVENT_ESCAPED, EVENT_STAGE_CLEAR } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_STAGE, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;
const WIN_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

function obstacleAhead(state, maxDistance) {
  let nearest = null;
  for (const ob of state.obstacles) {
    if (ob.kind === 'haystack' || ob.kind === 'mud') continue;
    const gap = ob.x - state.distance;
    if (gap > 0 && gap < maxDistance && (nearest === null || gap < nearest.gap)) {
      nearest = { gap, kind: ob.kind, width: ob.width };
    }
  }
  return nearest;
}

function knifeDanger(state) {
  for (const knife of state.knives) {
    const dx = knife.x - state.distance;
    if (dx > -20 && dx < 170 && knife.y > state.turkey.y - 130 && knife.y < GROUND_Y) return true;
  }
  return false;
}

function haystackNear(state) {
  return state.obstacles.some(
    (ob) => ob.kind === 'haystack' && ob.x - state.distance > -10 && ob.x - state.distance < 130,
  );
}

/**
 * Steer one step. `memory` keeps edge state between calls (when the last
 * jump was pressed) so a jump is one press, not a held key.
 */
function autopilot(state, memory, horizon) {
  const input = { direction: 0, jump: false, dash: false, hide: false };
  const turkey = state.turkey;
  const obstacle = obstacleAhead(state, 200);
  const danger = knifeDanger(state);

  // Hide when Barnaby is breathing down Giblet's neck and a haystack is near.
  if (state.farmer.gap < 130 && haystackNear(state) && turkey.onGround) {
    input.hide = true;
    return input;
  }
  // Jump the fence, the bale or the oven — a touch early, so the arc clears.
  if (obstacle && obstacle.gap < 150 && turkey.onGround && !memory.jumpedAt) {
    input.jump = true;
    memory.jumpedAt = state.distance;
  }
  // Still blocked mid-air (a tall bale): flap again.
  if (obstacle && obstacle.gap < 70 && !turkey.onGround && turkey.jumpsUsed < 2 && !memory.doubleJumped) {
    input.jump = true;
    memory.doubleJumped = true;
  }
  if (turkey.onGround) {
    memory.jumpedAt = null;
    memory.doubleJumped = false;
  }
  // A knife on the way in: dash straight through it.
  if (danger && turkey.dashCooldown <= 0 && !memory.dashed) {
    input.dash = true;
    memory.dashed = true;
  }
  if (!danger) memory.dashed = false;
  // The careful pilot (short horizon) brakes for corn; the bold one runs on.
  if (horizon < 0.4 && obstacle && obstacle.gap < 90) input.direction = -1;
  return input;
}

export function stageShot(name, world) {
  world.reset();
  const memory = { jumpedAt: null, doubleJumped: false, dashed: false };
  if (name !== 'play' && name !== 'end' && name !== 'win') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { direction: 0, jump: false, dash: false, hide: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'play' ? PLAY_SECONDS : name === 'win' ? WIN_LIMIT_SECONDS : END_LIMIT_SECONDS;
  const horizon = name === 'end' ? 0.25 : name === 'win' ? 0.7 : 0.7;
  let events = 0;
  for (let index = 0; index < limit / STEP; index += 1) {
    events = world.step(STEP, autopilot(world.state, memory, horizon), false);
    if (events & EVENT_CAUGHT) return { screen: SCREEN_OVER, best: Math.round(world.state.score) };
    if (events & EVENT_ESCAPED) return { screen: SCREEN_WIN, best: Math.round(world.state.score) };
    if (events & EVENT_STAGE_CLEAR) memory.dashed = false;
  }
  return { screen: SCREEN_PLAY, best: Math.round(world.state.score) };
}
