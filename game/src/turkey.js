// Giblet the turkey: physics, jumping, dashing and hiding.
// One clear job: how the player moves and what state the turkey is in.
import { GROUND_Y, TURKEY } from './config.js';

export const TURKEY_STATE = {
  RUNNING: 'running',
  JUMPING: 'jumping',
  DASHING: 'dashing',
  HIDING: 'hiding',
  HURT: 'hurt',
};

export function createTurkey() {
  const turkey = {
    x: TURKEY.x,
    y: GROUND_Y - TURKEY.height,
    vy: 0,
    width: TURKEY.width,
    height: TURKEY.height,
    onGround: true,
    jumpsUsed: 0,
    dashTime: 0,
    dashCooldown: 0,
    hideTime: 0,
    hurtTime: 0,
    invulnerableTime: 0,
    state: TURKEY_STATE.RUNNING,
    facing: 1,
    runCycle: 0,
    speed: TURKEY.runSpeed,
  };

  function reset() {
    turkey.y = GROUND_Y - TURKEY.height;
    turkey.vy = 0;
    turkey.onGround = true;
    turkey.jumpsUsed = 0;
    turkey.dashTime = 0;
    turkey.dashCooldown = 0;
    turkey.hideTime = 0;
    turkey.hurtTime = 0;
    turkey.invulnerableTime = 0;
    turkey.state = TURKEY_STATE.RUNNING;
    turkey.speed = TURKEY.runSpeed;
  }

  function tryJump() {
    if (turkey.state === TURKEY_STATE.HIDING) return false;
    if (turkey.onGround) {
      turkey.vy = -TURKEY.jumpVelocity;
      turkey.onGround = false;
      turkey.jumpsUsed = 1;
      turkey.state = TURKEY_STATE.JUMPING;
      return true;
    }
    if (turkey.jumpsUsed < 2) {
      // Second jump: a flap of the wings. Needs a feather? No — Giblet is
      // scrappy, but the second jump is weaker, so fences still matter.
      turkey.vy = -TURKEY.doubleJumpVelocity;
      turkey.jumpsUsed = 2;
      turkey.state = TURKEY_STATE.JUMPING;
      return true;
    }
    return false;
  }

  function tryDash() {
    if (turkey.dashCooldown > 0 || turkey.state === TURKEY_STATE.HIDING) return false;
    turkey.dashTime = TURKEY.dashSeconds;
    turkey.dashCooldown = TURKEY.dashCooldown;
    turkey.invulnerableTime = Math.max(turkey.invulnerableTime, TURKEY.dashSeconds);
    turkey.state = TURKEY_STATE.DASHING;
    return true;
  }

  function startHiding() {
    if (!turkey.onGround || turkey.state === TURKEY_STATE.HIDING) return false;
    turkey.hideTime = TURKEY.hideSeconds;
    turkey.state = TURKEY_STATE.HIDING;
    return true;
  }

  function hurt() {
    if (turkey.invulnerableTime > 0) return false;
    turkey.hurtTime = 0.6;
    turkey.invulnerableTime = 1.4;
    turkey.state = TURKEY_STATE.HURT;
    return true;
  }

  function step(dt, direction, wantHide, mudSlow) {
    turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
    turkey.hurtTime = Math.max(0, turkey.hurtTime - dt);
    turkey.invulnerableTime = Math.max(0, turkey.invulnerableTime - dt);

    if (turkey.state === TURKEY_STATE.HIDING) {
      turkey.hideTime -= dt;
      if (turkey.hideTime <= 0 || !wantHide) turkey.state = TURKEY_STATE.RUNNING;
      turkey.speed = 0;
    } else if (turkey.dashTime > 0) {
      turkey.dashTime -= dt;
      turkey.speed = TURKEY.dashSpeed;
      if (turkey.dashTime <= 0) turkey.state = turkey.onGround ? TURKEY_STATE.RUNNING : TURKEY_STATE.JUMPING;
    } else if (turkey.hurtTime > 0) {
      turkey.speed = TURKEY.walkSpeed;
    } else {
      // Holding left brakes (a real choice: slow down to grab corn, but the
      // farmer closes in); holding right sprints a touch faster.
      turkey.speed = direction < 0 ? TURKEY.walkSpeed : direction > 0 ? TURKEY.runSpeed + 40 : TURKEY.runSpeed;
      if (mudSlow) turkey.speed *= 0.55;
      if (!turkey.onGround) turkey.state = TURKEY_STATE.JUMPING;
      else if (turkey.state !== TURKEY_STATE.HURT) turkey.state = TURKEY_STATE.RUNNING;
    }

    if (turkey.state === TURKEY_STATE.HURT && turkey.hurtTime <= 0) {
      turkey.state = turkey.onGround ? TURKEY_STATE.RUNNING : TURKEY_STATE.JUMPING;
    }

    turkey.vy += TURKEY.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y - turkey.height) {
      turkey.y = GROUND_Y - turkey.height;
      turkey.vy = 0;
      turkey.onGround = true;
      turkey.jumpsUsed = 0;
      if (turkey.state === TURKEY_STATE.JUMPING) turkey.state = TURKEY_STATE.RUNNING;
    } else {
      turkey.onGround = false;
    }

    turkey.runCycle += dt * (turkey.speed / 40);
    return turkey.speed;
  }

  return { turkey, reset, tryJump, tryDash, startHiding, hurt, step };
}
