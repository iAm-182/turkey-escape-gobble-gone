// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between six screens: title, play, stage clear, paused, caught and escaped.
//
// ?seed=N fixes the escape. ?shot=start|play|end|win (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_HIT, EVENT_PICKUP, EVENT_SPOTTED, EVENT_STAGE_CLEAR } from './world.js';
import { ACTION_CONFIRM, ACTION_DASH, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_STAGE, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const STAGE_BANNER_SECONDS = 1.8;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// Debug handle for play-testing: the state a probe can read.
window.__gobble = { world, screen: SCREEN_TITLE };

function runShot(name) {
  const scene = stageShot(name, world);
  window.__gobble.screen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let stageBanner = 0;
  let time = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    stageBanner = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.gobble();
    audio.startMusic();
    announce('Playing. Escape all three stages!');
  }

  function endGame(escaped) {
    screen = escaped ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = Math.round(world.state.score);
      saveBest(best);
    }
    audio.stopMusic();
    if (escaped) audio.fanfare();
    else audio.sadTrombone();
    announce(escaped ? `Escaped! Score ${Math.round(world.state.score)}.` : `Caught. Score ${Math.round(world.state.score)}. Best ${best}.`);
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
      if (!muted && screen === SCREEN_PLAY) audio.startMusic();
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      audio.startMusic();
      announce('Playing.');
    }
  }

  function step() {
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { direction: 0, jump: false, dash: false, hide: false }, true);
      return;
    }
    if (screen === SCREEN_STAGE) {
      stageBanner -= STEP;
      if (stageBanner <= 0) screen = SCREEN_PLAY;
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP, {
      direction: input.direction(),
      jump: Boolean(actions & ACTION_JUMP),
      dash: Boolean(actions & ACTION_DASH),
      hide: input.hiding(),
    }, false);
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_SPOTTED) audio.alarm();
    if (events & EVENT_HIT) audio.thud();
    if (events & EVENT_STAGE_CLEAR) {
      screen = SCREEN_STAGE;
      stageBanner = STAGE_BANNER_SECONDS;
      audio.fanfare();
    } else if (events & EVENT_ESCAPED) {
      endGame(true);
    } else if (events & EVENT_CAUGHT) {
      endGame(false);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    time += dt;
    accumulator += dt;
    // Actions on the title / over screens are handled even between steps.
    if (screen !== SCREEN_PLAY && screen !== SCREEN_STAGE) {
      handleActions(input.takeActions());
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY || screen === SCREEN_STAGE) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY || screen === SCREEN_STAGE)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    window.__gobble.screen = screen;
    renderer.draw(world.state, screen, best, time);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    }
  });

  announce('Gobble and Gone. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
