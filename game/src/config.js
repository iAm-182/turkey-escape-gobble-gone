// Gobble & Gone — tuning, stage definitions and shared constants.
// One clear job: every number the game balances lives here, nowhere else.
export const STEP = 1 / 60;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const GROUND_Y = 452;
export const BEST_KEY = 'gobble-and-gone-best';

// The turkey's body. Speeds are px/s; the run is a side-scroller, so the
// turkey holds a fixed screen x and the world scrolls past it.
export const TURKEY = {
  x: 190,
  width: 52,
  height: 46,
  runSpeed: 300,
  walkSpeed: 150,
  jumpVelocity: 640,
  doubleJumpVelocity: 560,
  gravity: 1750,
  dashSpeed: 720,
  dashSeconds: 0.22,
  dashCooldown: 1.1,
  hideSeconds: 0.35,
  maxLives: 5,
  startLives: 3,
};

export const FARMER = {
  width: 56,
  height: 92,
  throwEvery: 2.6,
  throwEveryMin: 1.5,
  spotGap: 210,
  cornerGap: 90,
  catchGap: 26,
};

// Three stages of one escape: the farmyard, the barnyard, then the kitchen.
// Each stage is a distance to cover; the farmer, the hazards and the speed
// all grow from one stage to the next.
export const STAGES = [
  {
    name: 'The Farmyard',
    subtitle: 'Dawn breaks. The farmer is up — RUN, Giblet!',
    length: 2600,
    scrollBase: 300,
    knifeEvery: 2.8,
    fallingKnives: true,
    ovens: false,
    mud: false,
    palette: { skyTop: '#ffd9a0', skyBottom: '#ff9e57', ground: '#8a5a2b', grass: '#7fae4c' },
  },
  {
    name: 'The Barnyard',
    subtitle: 'Past the barn — mud, fences and a farmer who smells dinner.',
    length: 3200,
    scrollBase: 340,
    knifeEvery: 2.1,
    fallingKnives: true,
    ovens: false,
    mud: true,
    palette: { skyTop: '#ffb36b', skyBottom: '#e2603f', ground: '#6e4a26', grass: '#5d8a3c' },
  },
  {
    name: 'The Kitchen',
    subtitle: 'The oven is HOT and the knives are out. Freedom is past the door!',
    length: 3600,
    scrollBase: 380,
    knifeEvery: 1.5,
    fallingKnives: true,
    ovens: true,
    mud: false,
    palette: { skyTop: '#3a2b3f', skyBottom: '#7a3b2e', ground: '#4a2c22', grass: '#8a6a4a' },
  },
];

export const SCORE = {
  corn: 100,
  pumpkin: 250,
  feather: 50,
  distancePerMetre: 2,
  stageClear: 500,
  escapeBonus: 1000,
};
