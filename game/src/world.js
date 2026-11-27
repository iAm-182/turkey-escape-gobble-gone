// The world: stages, obstacles, pickups, knives, collisions and scoring.
// One clear job: everything the turkey runs through, and what it costs.
import { FARMER, GROUND_Y, SCORE, STAGES, STEP, TURKEY } from './config.js';
import { createFarmer } from './farmer.js';
import { createTurkey, TURKEY_STATE } from './turkey.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_STAGE_CLEAR = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_SPOTTED = 32;

const OBSTACLE_FENCE = 'fence';
const OBSTACLE_HAYBALE = 'haybale';
const OBSTACLE_OVEN = 'oven';
const OBSTACLE_MUD = 'mud';
const OBSTACLE_HAYSTACK = 'haystack';

export const KIND_CORN = 'corn';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_FEATHER = 'feather';
export const KIND_HEART = 'heart';

export function createWorld(random) {
  const turkeyApi = createTurkey();
  const farmerApi = createFarmer(random);
  const turkey = turkeyApi.turkey;
  const farmer = farmerApi.farmer;

  const state = {
    turkey,
    farmer,
    stageIndex: 0,
    distance: 0,
    score: 0,
    corn: 0,
    lives: TURKEY.startLives,
    combo: 0,
    comboTimer: 0,
    obstacles: [],
    pickups: [],
    knives: [],
    nextSpawnAt: 500,
    knifeTimer: 3.5,
    message: '',
    messageTimer: 0,
    escaped: false,
    caught: false,
    stageClearTimer: 0,
  };

  function stage() {
    return STAGES[state.stageIndex];
  }

  function reset() {
    state.stageIndex = 0;
    state.distance = 0;
    state.score = 0;
    state.corn = 0;
    state.lives = TURKEY.startLives;
    state.combo = 0;
    state.comboTimer = 0;
    state.obstacles = [];
    state.pickups = [];
    state.knives = [];
    state.nextSpawnAt = 800;
    state.knifeTimer = 3.5;
    state.message = '';
    state.messageTimer = 0;
    state.escaped = false;
    state.caught = false;
    state.stageClearTimer = 0;
    turkeyApi.reset();
    farmerApi.reset();
  }

  function spawnAhead() {
    const at = state.nextSpawnAt;
    const roll = random.next();
    const current = stage();
    if (current.ovens && roll < 0.22) {
      // A hot oven: a glowing zone on the floor. Jump clean over it.
      state.obstacles.push({ kind: OBSTACLE_OVEN, x: at, width: 110, height: 64 });
    } else if (roll < 0.5) {
      state.obstacles.push({ kind: OBSTACLE_FENCE, x: at, width: 26, height: 52 });
      if (random.next() < 0.4) {
        state.pickups.push({ kind: KIND_CORN, x: at + 60, y: GROUND_Y - 120, taken: false });
      }
    } else if (roll < 0.68) {
      state.obstacles.push({ kind: OBSTACLE_HAYBALE, x: at, width: 64, height: 58 });
    } else if (roll < 0.82) {
      // A haystack to hide in: hold Down inside it and the farmer loses you.
      state.obstacles.push({ kind: OBSTACLE_HAYSTACK, x: at, width: 78, height: 84 });
    } else if (current.mud) {
      state.obstacles.push({ kind: OBSTACLE_MUD, x: at, width: 150, height: 10 });
    } else {
      state.obstacles.push({ kind: OBSTACLE_FENCE, x: at, width: 26, height: 52 });
    }
    // Pickups between obstacles: corn lines, a rare pumpkin, a feather.
    const pickupRoll = random.next();
    if (pickupRoll < 0.45) {
      for (let i = 0; i < 3; i += 1) {
        state.pickups.push({ kind: KIND_CORN, x: at + 140 + i * 46, y: GROUND_Y - 76, taken: false });
      }
    } else if (pickupRoll < 0.55) {
      state.pickups.push({ kind: KIND_PUMPKIN, x: at + 150, y: GROUND_Y - 90, taken: false });
    } else if (pickupRoll < 0.68) {
      state.pickups.push({ kind: KIND_FEATHER, x: at + 150, y: GROUND_Y - 170, taken: false });
    } else if (pickupRoll < 0.73 && state.lives < TURKEY.maxLives) {
      state.pickups.push({ kind: KIND_HEART, x: at + 150, y: GROUND_Y - 90, taken: false });
    }
    state.nextSpawnAt = at + random.range(520, 820);
  }

  function overlaps(aX, aW, bX, bW) {
    return aX < bX + bW && aX + aW > bX;
  }

  function turkeyRect() {
    return { x: state.distance, y: turkey.y, width: turkey.width, height: turkey.height };
  }

  function loseLife(reason) {
    if (!turkeyApi.hurt()) return EVENT_NONE;
    state.lives -= 1;
    state.combo = 0;
    state.message = reason;
    state.messageTimer = 1.4;
    if (state.lives <= 0) {
      state.caught = true;
      return EVENT_CAUGHT;
    }
    return EVENT_HIT;
  }

  // One fixed step. `input` is { direction, jump, dash, hide }.
  // `attract` (title screen) runs the world as a demo with no farmer.
  function step(dt, input, attract) {
    let events = EVENT_NONE;
    const current = stage();
    const rect = turkeyRect();

    const inMud = state.obstacles.some(
      (ob) => ob.kind === OBSTACLE_MUD && overlaps(rect.x, rect.width, ob.x, ob.width) && turkey.onGround,
    );

    if (input.jump) turkeyApi.tryJump();
    if (input.dash) turkeyApi.tryDash();
    if (input.hide) turkeyApi.startHiding();

    const speed = turkeyApi.step(dt, input.direction, input.hide, inMud);
    if (!attract) state.distance += speed * dt;

    // Spawning ahead of the turkey, pruning behind it.
    while (state.nextSpawnAt < state.distance + 1100) spawnAhead();
    state.obstacles = state.obstacles.filter((ob) => ob.x + ob.width > state.distance - 500);
    state.pickups = state.pickups.filter((pk) => !pk.taken && pk.x > state.distance - 300);
    state.knives = state.knives.filter((kn) => kn.y < GROUND_Y + 120 && kn.x > state.distance - 400);

    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    if (!attract) {
      // The farmer: chase, search, throw. A throw looses a carving knife.
      const farmerEvent = farmerApi.step(dt, speed, turkey.state === TURKEY_STATE.HIDING, turkey.hurtTime > 0, state.stageIndex);
      if (farmerEvent === 'throw') {
        state.knives.push({
          kind: 'thrown', x: state.distance - farmer.gap, y: GROUND_Y - 150,
          vx: speed + 300, vy: 40, width: 34, height: 12,
        });
      }
      if (farmer.spotted && !state.spottedShown) {
        state.spottedShown = true;
        events |= EVENT_SPOTTED;
      }
      if (!farmer.spotted) state.spottedShown = false;
      if (farmerApi.caught()) {
        state.message = 'CAUGHT! Barnaby grabbed your tail feathers!';
        state.messageTimer = 1.4;
        events |= loseLife('CAUGHT! Barnaby grabbed your tail feathers!');
        if (events & EVENT_CAUGHT) return events;
        farmerApi.pushBack(240);
      }
    }

    // Falling knives from above, on the stage's own timer.
    state.knifeTimer -= dt;
    if (!attract && current.fallingKnives && state.knifeTimer <= 0) {
      state.knifeTimer = current.knifeEvery * random.range(0.8, 1.3);
      state.knives.push({
        kind: 'falling', x: state.distance + random.range(260, 700), y: -30,
        vx: 0, vy: random.range(420, 540), width: 14, height: 44,
      });
    }

    for (const knife of state.knives) {
      knife.x += knife.vx * dt;
      knife.y += knife.vy * dt;
    }

    // Collisions: fences and hay bales trip the turkey, ovens burn it,
    // knives cut it. Hiding in a haystack is safe.
    const hidden = turkey.state === TURKEY_STATE.HIDING;
    if (!hidden && turkey.invulnerableTime <= 0) {
      for (const ob of state.obstacles) {
        if (!overlaps(rect.x, rect.width, ob.x, ob.width)) continue;
        const top = GROUND_Y - ob.height;
        if (ob.kind === OBSTACLE_FENCE || ob.kind === OBSTACLE_HAYBALE) {
          if (rect.y + rect.height > top + 6) {
            events |= loseLife(ob.kind === OBSTACLE_FENCE ? 'Tripped over a fence!' : 'Slammed into a hay bale!');
            if (events & EVENT_CAUGHT) return events;
            break;
          }
        } else if (ob.kind === OBSTACLE_OVEN) {
          if (rect.y + rect.height > top + 10) {
            events |= loseLife('TOO HOT! The oven singed your feathers!');
            if (events & EVENT_CAUGHT) return events;
            turkey.vy = -420;
            turkey.onGround = false;
            break;
          }
        }
      }
      for (const knife of state.knives) {
        if (knife.x + knife.width < rect.x || knife.x > rect.x + rect.width) continue;
        if (knife.y + knife.height < rect.y || knife.y > rect.y + rect.height) continue;
        events |= loseLife('A carving knife nicked you!');
        if (events & EVENT_CAUGHT) return events;
        knife.y = GROUND_Y + 200;
        break;
      }
    }

    // Pickups.
    for (const pk of state.pickups) {
      if (pk.taken) continue;
      const px = pk.x;
      const py = pk.y;
      if (px > rect.x - 26 && px < rect.x + rect.width + 26 && py > rect.y - 26 && py < rect.y + rect.height + 26) {
        pk.taken = true;
        if (pk.kind === KIND_CORN) {
          state.corn += 1;
          state.combo = Math.min(5, state.combo + 1);
          state.comboTimer = 3;
          state.score += SCORE.corn * state.combo;
        } else if (pk.kind === KIND_PUMPKIN) {
          state.score += SCORE.pumpkin;
        } else if (pk.kind === KIND_FEATHER) {
          state.score += SCORE.feather;
          turkey.dashCooldown = 0;
          turkey.jumpsUsed = 0;
        } else if (pk.kind === KIND_HEART) {
          state.lives = Math.min(TURKEY.maxLives, state.lives + 1);
        }
        events |= EVENT_PICKUP;
      }
    }

    // Score for distance: every metre of freedom counts (kept fractional
    // here and rounded where it is shown, so slow steps still add up).
    state.score += (speed * dt * SCORE.distancePerMetre) / 50;

    // Stage clear → next stage, or the great escape.
    if (!attract && state.distance >= current.length) {
      state.score += SCORE.stageClear;
      if (state.stageIndex >= STAGES.length - 1) {
        state.escaped = true;
        state.score += SCORE.escapeBonus;
        return events | EVENT_ESCAPED;
      }
      state.stageIndex += 1;
      state.distance = 0;
      state.nextSpawnAt = 500;
      state.obstacles = [];
      state.pickups = [];
      state.knives = [];
      farmerApi.pushBack(160);
      state.message = `${STAGES[state.stageIndex].name} — ${STAGES[state.stageIndex].subtitle}`;
      state.messageTimer = 2.4;
      return events | EVENT_STAGE_CLEAR;
    }
    return events;
  }

  return { state, stage, reset, step, loseLife };
}
