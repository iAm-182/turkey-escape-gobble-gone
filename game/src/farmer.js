// Farmer Barnaby: the chaser. He runs behind the turkey, throws carving
// knives, searches when the turkey hides, and corners it when it slows.
// One clear job: the farmer's AI — chase, search, throw, corner.
import { FARMER, GROUND_Y, TURKEY } from './config.js';

export const FARMER_STATE = {
  CHASE: 'chase',
  SEARCH: 'search',
  THROW: 'throw',
  CORNER: 'corner',
};

export function createFarmer(random) {
  const farmer = {
    // Gap in px behind the turkey. 0 means caught.
    gap: 260,
    x: TURKEY.x - 260,
    y: GROUND_Y - FARMER.height,
    width: FARMER.width,
    height: FARMER.height,
    state: FARMER_STATE.CHASE,
    searchTime: 0,
    throwTimer: 2.0,
    throwAnim: 0,
    runCycle: 0,
    spotted: false,
  };

  function reset() {
    farmer.gap = 260;
    farmer.x = TURKEY.x - 260;
    farmer.state = FARMER_STATE.CHASE;
    farmer.searchTime = 0;
    farmer.throwTimer = 2.0;
    farmer.throwAnim = 0;
    farmer.spotted = false;
  }

  // Returns 'throw' when the farmer looses a knife this step.
  function step(dt, turkeySpeed, turkeyHidden, turkeyHurt, stageIndex) {
    farmer.throwAnim = Math.max(0, farmer.throwAnim - dt);
    farmer.throwTimer -= dt;

    if (turkeyHidden) {
      // He lost the trail: stop, scratch his head, look around. The gap
      // grows while he searches — hiding is the escape valve.
      if (farmer.state !== FARMER_STATE.SEARCH) {
        farmer.state = FARMER_STATE.SEARCH;
        farmer.searchTime = 1.6;
      }
      farmer.searchTime -= dt;
      farmer.gap = Math.min(420, farmer.gap + 130 * dt);
      if (farmer.searchTime <= 0) {
        farmer.state = FARMER_STATE.CHASE;
        farmer.throwTimer = 1.2;
      }
      farmer.x = TURKEY.x - farmer.gap;
      farmer.runCycle += dt * 2;
      return null;
    }

    if (farmer.state === FARMER_STATE.SEARCH) farmer.state = FARMER_STATE.CHASE;

    // The farmer runs at a base pace that grows per stage; he gains on a
    // slow or hurt turkey and loses ground to a fast, dashing one.
    const basePace = 268 + stageIndex * 22;
    const closing = basePace - turkeySpeed + (turkeyHurt ? 60 : 0);
    farmer.gap = Math.max(0, farmer.gap - closing * dt);

    if (farmer.gap <= FARMER.cornerGap) {
      farmer.state = FARMER_STATE.CORNER;
    } else if (farmer.state === FARMER_STATE.CORNER && farmer.gap > FARMER.cornerGap + 40) {
      farmer.state = FARMER_STATE.CHASE;
    } else if (farmer.state !== FARMER_STATE.CORNER) {
      farmer.state = FARMER_STATE.CHASE;
    }

    farmer.spotted = farmer.gap <= FARMER.spotGap;
    farmer.x = TURKEY.x - farmer.gap;
    farmer.runCycle += dt * (basePace / 28);

    if (farmer.throwTimer <= 0 && farmer.gap < 430) {
      farmer.throwTimer = Math.max(FARMER.throwEveryMin, FARMER.throwEvery - stageIndex * 0.35);
      farmer.throwAnim = 0.35;
      return 'throw';
    }
    return null;
  }

  function caught() {
    return farmer.gap <= FARMER.catchGap;
  }

  function pushBack(distance) {
    farmer.gap = Math.min(460, farmer.gap + distance);
  }

  return { farmer, reset, step, caught, pushBack };
}
