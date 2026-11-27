// Keyboard and mouse input. One clear job: turn keys and clicks into the
// game's actions (move, jump, dash, hide, confirm, pause, mute).
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_JUMP = 8;
export const ACTION_DASH = 16;
export const ACTION_HIDE = 32;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DASH_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'KeyX']);
const HIDE_KEYS = new Set(['ArrowDown', 'KeyS']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let jumpPressed = false;
  let dashPressed = false;

  function onKeyDown(event) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    held.add(event.code);
    if (JUMP_KEYS.has(event.code)) {
      jumpPressed = true;
      queued |= ACTION_JUMP;
    }
    if (DASH_KEYS.has(event.code)) {
      dashPressed = true;
      queued |= ACTION_DASH;
    }
    if (HIDE_KEYS.has(event.code)) queued |= ACTION_HIDE;
    if (event.code === 'Enter' || event.code === 'Space') queued |= ACTION_CONFIRM;
    if (event.code === 'KeyP' || event.code === 'Escape') queued |= ACTION_PAUSE;
    if (event.code === 'KeyM') queued |= ACTION_MUTE;
  }

  function onKeyUp(event) {
    held.delete(event.code);
    if (JUMP_KEYS.has(event.code)) jumpPressed = false;
    if (DASH_KEYS.has(event.code)) dashPressed = false;
  }

  function onPointerDown(event) {
    event.preventDefault();
    queued |= ACTION_CONFIRM;
    canvas.focus?.();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    // -1 left, +1 right, 0 still. The turkey always runs right unless the
    // player holds back to slow down and let the farmer close in — a choice.
    direction() {
      const left = [...LEFT_KEYS].some((code) => held.has(code));
      const right = [...RIGHT_KEYS].some((code) => held.has(code));
      if (left && !right) return -1;
      if (right && !left) return 1;
      return 0;
    },
    hiding() {
      return [...HIDE_KEYS].some((code) => held.has(code));
    },
    jumpHeld() { return jumpPressed; },
    dashHeld() { return dashPressed; },
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
  };
}
