// All drawing: the farm, the kitchen, the turkey, the farmer, the HUD and
// every screen. One clear job: paint the state, nothing else.
import { GROUND_Y, STAGES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { TURKEY_STATE } from './turkey.js';
import { FARMER_STATE } from './farmer.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_STAGE = 'stage';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function text(string, x, y, size, color, align = 'center', weight = 'bold') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px 'Trebuchet MS', Verdana, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(string, x, y);
  }

  function outlineText(string, x, y, size, color, stroke = '#3a1f0d', align = 'center') {
    ctx.font = `bold ${size}px 'Trebuchet MS', Verdana, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = stroke;
    ctx.strokeText(string, x, y);
    ctx.fillStyle = color;
    ctx.fillText(string, x, y);
  }

  function drawSky(palette, distance) {
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y);
    // Sun and drifting clouds.
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(820, 74, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i += 1) {
      const cx = ((i * 340 - distance * 0.12) % (VIEW_WIDTH + 240) + VIEW_WIDTH + 240) % (VIEW_WIDTH + 240) - 120;
      ctx.beginPath();
      ctx.ellipse(cx, 60 + i * 46, 52, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, 66 + i * 46, 38, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Distant barn and trees, parallax-slow.
    const bx = 700 - (distance * 0.25) % 1200;
    ctx.fillStyle = '#a33327';
    ctx.fillRect(bx, 300, 130, 110);
    ctx.fillStyle = '#7c241a';
    ctx.beginPath();
    ctx.moveTo(bx - 12, 302);
    ctx.lineTo(bx + 65, 252);
    ctx.lineTo(bx + 142, 302);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + 52, 330, 26, 26);
    ctx.fillStyle = '#5d8a3c';
    for (let i = 0; i < 4; i += 1) {
      const tx = ((i * 260 - distance * 0.4) % (VIEW_WIDTH + 200) + VIEW_WIDTH + 200) % (VIEW_WIDTH + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(tx, 330);
      ctx.lineTo(tx + 34, 400);
      ctx.lineTo(tx - 34, 400);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawGround(palette, distance) {
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
    ctx.fillStyle = palette.grass;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 12);
    // Scrolling tufts and pebbles.
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i += 1) {
      const x = ((i * 97 - distance) % (VIEW_WIDTH + 80) + VIEW_WIDTH + 80) % (VIEW_WIDTH + 80) - 40;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 34 + (i % 5) * 10);
      ctx.lineTo(x + 8, GROUND_Y + 26 + (i % 5) * 10);
      ctx.stroke();
    }
  }

  function drawFence(screenX) {
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(screenX, GROUND_Y - 52);
    ctx.lineTo(screenX, GROUND_Y);
    ctx.moveTo(screenX + 26, GROUND_Y - 52);
    ctx.lineTo(screenX + 26, GROUND_Y);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(screenX - 6, GROUND_Y - 40);
    ctx.lineTo(screenX + 32, GROUND_Y - 40);
    ctx.moveTo(screenX - 6, GROUND_Y - 18);
    ctx.lineTo(screenX + 32, GROUND_Y - 18);
    ctx.stroke();
  }

  function drawHayBale(screenX) {
    ctx.fillStyle = '#e0a83c';
    ctx.beginPath();
    ctx.ellipse(screenX + 32, GROUND_Y - 26, 34, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b9822a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(screenX + 32, GROUND_Y - 26, 22, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHaystack(screenX) {
    ctx.fillStyle = '#d99a2b';
    ctx.beginPath();
    ctx.moveTo(screenX, GROUND_Y);
    ctx.quadraticCurveTo(screenX + 39, GROUND_Y - 108, screenX + 78, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a8741a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(screenX + 12 + i * 13, GROUND_Y - 12 - i * 6);
      ctx.lineTo(screenX + 20 + i * 13, GROUND_Y - 34 - i * 6);
      ctx.stroke();
    }
    text('HIDE!', screenX + 39, GROUND_Y - 96, 13, '#fff', 'center');
  }

  function drawOven(screenX, time) {
    // A glowing oven: jump clean over the heat.
    ctx.fillStyle = '#2e2a33';
    roundRect(screenX, GROUND_Y - 64, 110, 64, 8);
    ctx.fill();
    const flicker = 0.6 + 0.4 * Math.sin(time * 9 + screenX);
    ctx.fillStyle = `rgba(255,${Math.floor(90 + 80 * flicker)},20,${0.75 + 0.25 * flicker})`;
    roundRect(screenX + 12, GROUND_Y - 52, 86, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#ff5a1f';
    ctx.beginPath();
    ctx.moveTo(screenX + 26, GROUND_Y - 52);
    ctx.quadraticCurveTo(screenX + 40, GROUND_Y - 78, screenX + 54, GROUND_Y - 52);
    ctx.quadraticCurveTo(screenX + 68, GROUND_Y - 74, screenX + 82, GROUND_Y - 52);
    ctx.closePath();
    ctx.fill();
    text('HOT!', screenX + 55, GROUND_Y - 78, 15, '#ff6b2c');
  }

  function drawMud(screenX) {
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath();
    ctx.ellipse(screenX + 75, GROUND_Y - 4, 78, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(screenX + 50, GROUND_Y - 6, 22, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCorn(screenX, y, time) {
    const bob = Math.sin(time * 4 + screenX) * 3;
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.ellipse(screenX, y + bob, 11, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, y + bob - 12);
    ctx.lineTo(screenX, y + bob + 12);
    ctx.stroke();
    ctx.fillStyle = '#7fae4c';
    ctx.beginPath();
    ctx.moveTo(screenX - 9, y + bob + 8);
    ctx.lineTo(screenX - 16, y + bob + 20);
    ctx.lineTo(screenX - 2, y + bob + 16);
    ctx.closePath();
    ctx.fill();
  }

  function drawPumpkin(screenX, y, time) {
    const bob = Math.sin(time * 3 + screenX) * 3;
    ctx.fillStyle = '#ff7b1c';
    ctx.beginPath();
    ctx.ellipse(screenX, y + bob, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d8a3c';
    ctx.fillRect(screenX - 2, y + bob - 20, 5, 8);
  }

  function drawFeather(screenX, y, time) {
    const bob = Math.sin(time * 5 + screenX) * 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(screenX, y + bob, 7, 15, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, y + bob - 14);
    ctx.lineTo(screenX + 4, y + bob + 12);
    ctx.stroke();
  }

  function drawHeart(screenX, y, time) {
    const bob = Math.sin(time * 4 + screenX) * 3;
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(screenX - 7, y + bob, 8, 0, Math.PI * 2);
    ctx.arc(screenX + 7, y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(screenX - 14, y + bob + 2);
    ctx.lineTo(screenX, y + bob + 16);
    ctx.lineTo(screenX + 14, y + bob + 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawKnife(screenX, y, kind) {
    ctx.save();
    ctx.translate(screenX, y);
    if (kind === 'falling') ctx.rotate(0.5);
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, 6);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(-12, 1, 12, 10);
    ctx.restore();
  }

  function drawTurkey(turkey, time) {
    const x = turkey.x;
    const y = turkey.y;
    const legSwing = Math.sin(turkey.runCycle) * 10;
    const hidden = turkey.state === TURKEY_STATE.HIDING;
    ctx.save();
    if (turkey.invulnerableTime > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    // Tail fan.
    ctx.fillStyle = '#8a5a2b';
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(x + 8, y + 22);
      ctx.rotate(-0.5 + i * 0.35);
      ctx.beginPath();
      ctx.ellipse(-16, 0, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#ff9f1c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 40);
    ctx.lineTo(x + 22 + legSwing, GROUND_Y);
    ctx.moveTo(x + 34, y + 40);
    ctx.lineTo(x + 34 - legSwing, GROUND_Y);
    ctx.stroke();
    // Body.
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.ellipse(x + 26, y + 24, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#54331d';
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 24, 14, 9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Head.
    ctx.fillStyle = '#7a4a2a';
    ctx.beginPath();
    ctx.arc(x + 46, y + 6, 11, 0, Math.PI * 2);
    ctx.fill();
    // Beak + wattle.
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(x + 54, y + 4);
    ctx.lineTo(x + 66, y + 8);
    ctx.lineTo(x + 54, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(x + 52, y + 14, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye — wide with panic.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 48, y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + 49, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    if (hidden) {
      text('HIDDEN!', x + 26, y - 18, 14, '#fff');
    }
    ctx.restore();
  }

  function drawFarmer(farmer, time) {
    const x = farmer.x;
    const y = farmer.y;
    const legSwing = Math.sin(farmer.runCycle) * 12;
    ctx.save();
    // Legs.
    ctx.strokeStyle = '#2b4a7a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 62);
    ctx.lineTo(x + 20 + legSwing, GROUND_Y);
    ctx.moveTo(x + 36, y + 62);
    ctx.lineTo(x + 36 - legSwing, GROUND_Y);
    ctx.stroke();
    // Overalls + shirt.
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + 12, y + 26, 34, 38);
    ctx.fillStyle = '#2b4a7a';
    ctx.fillRect(x + 12, y + 48, 34, 18);
    ctx.fillRect(x + 14, y + 26, 7, 24);
    ctx.fillRect(x + 35, y + 26, 7, 24);
    // Arms: pumping while chasing, scratching head while searching.
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    if (farmer.state === FARMER_STATE.SEARCH) {
      ctx.moveTo(x + 44, y + 30);
      ctx.lineTo(x + 52, y + 6);
    } else {
      ctx.moveTo(x + 12, y + 30);
      ctx.lineTo(x + 2, y + 44 - legSwing * 0.4);
      ctx.moveTo(x + 44, y + 30);
      ctx.lineTo(x + 54, y + 44 + legSwing * 0.4);
    }
    ctx.stroke();
    // Head + straw hat.
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath();
    ctx.arc(x + 29, y + 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0a83c';
    ctx.beginPath();
    ctx.ellipse(x + 29, y + 4, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 18, y - 8, 22, 12);
    // Angry eyes + moustache.
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + 33, y + 12, 2, 0, Math.PI * 2);
    ctx.arc(x + 39, y + 12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 10);
    ctx.lineTo(x + 36, y + 12);
    ctx.moveTo(x + 42, y + 10);
    ctx.lineTo(x + 36, y + 12);
    ctx.stroke();
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(x + 30, y + 20, 14, 4);
    if (farmer.state === FARMER_STATE.SEARCH) text('?', x + 52, y - 16, 22, '#fff');
    if (farmer.throwAnim > 0) {
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.moveTo(x + 56, y + 30);
      ctx.lineTo(x + 78, y + 26);
      ctx.lineTo(x + 56, y + 38);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHud(state, screen) {
    const current = STAGES[state.stageIndex];
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    roundRect(10, 8, VIEW_WIDTH - 20, 46, 10);
    ctx.fill();
    text(`SCORE ${Math.round(state.score)}`, 26, 31, 20, '#ffd23e', 'left');
    text(`CORN ${state.corn}`, 200, 31, 17, '#ffd23e', 'left');
    text(`${current.name.toUpperCase()}  ${state.stageIndex + 1}/3`, VIEW_WIDTH / 2, 24, 17, '#fff');
    const progress = Math.min(1, state.distance / current.length);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(VIEW_WIDTH / 2 - 110, 36, 220, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#7fae4c';
    roundRect(VIEW_WIDTH / 2 - 110, 36, 220 * progress, 8, 4);
    ctx.fill();
    text('FREEDOM »', VIEW_WIDTH / 2 + 122, 40, 11, '#b8e986', 'left');
    // Lives as hearts.
    for (let i = 0; i < state.lives; i += 1) {
      const hx = VIEW_WIDTH - 30 - i * 26;
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(hx - 5, 26, 6, 0, Math.PI * 2);
      ctx.arc(hx + 5, 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 10, 28);
      ctx.lineTo(hx, 40);
      ctx.lineTo(hx + 10, 28);
      ctx.closePath();
      ctx.fill();
    }
    // Farmer proximity meter: how close Barnaby is.
    const closeness = Math.max(0, 1 - state.farmer.gap / 460);
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    roundRect(10, 62, 210, 30, 8);
    ctx.fill();
    text('FARMER', 20, 77, 12, '#ffb3ab', 'left');
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(92, 70, 112, 12, 6);
    ctx.fill();
    ctx.fillStyle = closeness > 0.75 ? '#e63946' : closeness > 0.45 ? '#ff9f1c' : '#ffd23e';
    roundRect(92, 70, 112 * closeness, 12, 6);
    ctx.fill();
    if (state.farmer.spotted && screen === SCREEN_PLAY) {
      const flash = Math.floor(time * 5) % 2 === 0;
      outlineText('SPOTTED! RUN!', VIEW_WIDTH / 2, 110, flash ? 26 : 22, '#ff4d2e');
    }
    if (state.combo >= 2) {
      text(`COMBO x${state.combo} — corn streak!`, VIEW_WIDTH - 24, 108, 15, '#ffd23e', 'right');
    }
    if (state.messageTimer > 0 && state.message && screen === SCREEN_PLAY) {
      outlineText(state.message, VIEW_WIDTH / 2, 150, 20, '#fff');
    }
  }

  function drawTitle(state, best, time) {
    drawSky(STAGES[0].palette, 0);
    drawGround(STAGES[0].palette, 0);
    drawTurkey({ ...state.turkey, x: 300, y: GROUND_Y - 46, runCycle: 0.6, state: TURKEY_STATE.RUNNING, invulnerableTime: 0 }, 0.6);
    drawFarmer({ ...state.farmer, x: 620, y: GROUND_Y - 92, runCycle: 0.4, state: FARMER_STATE.CHASE, throwAnim: 0 }, 0.4);
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    roundRect(90, 36, VIEW_WIDTH - 180, 250, 18);
    ctx.fill();
    outlineText('GOBBLE & GONE', VIEW_WIDTH / 2, 92, 58, '#ffd23e');
    outlineText('THE GREAT TURKEY ESCAPE', VIEW_WIDTH / 2, 140, 24, '#fff');
    text('Thanksgiving is coming. Farmer Barnaby has the oven on', VIEW_WIDTH / 2, 178, 17, '#ffe9b0');
    text('and the carving knife out. You are the dinner — unless you run.', VIEW_WIDTH / 2, 202, 17, '#ffe9b0');
    text('← → move   •   SPACE jump (twice!)   •   SHIFT dash   •   ↓ hide in haystacks', VIEW_WIDTH / 2, 232, 15, '#b8e986');
    text('Grab corn, dodge knives, jump the ovens — escape all 3 stages!', VIEW_WIDTH / 2, 256, 15, '#b8e986');
    const pulse = 0.85 + 0.15 * Math.sin(time * 2.5);
    ctx.globalAlpha = pulse;
    outlineText('PRESS SPACE OR CLICK TO PLAY', VIEW_WIDTH / 2, 330, 24, '#fff');
    ctx.globalAlpha = 1;
    if (best > 0) text(`Best escape score: ${best}`, VIEW_WIDTH / 2, 368, 16, '#ffd23e');
    text('A game by Giblet Studios — original art, music & code', VIEW_WIDTH / 2, 512, 13, 'rgba(255,255,255,0.75)');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(10,8,6,0.65)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    outlineText('PAUSED', VIEW_WIDTH / 2, 220, 52, '#fff');
    text('Press P or click to keep running', VIEW_WIDTH / 2, 280, 18, '#ffe9b0');
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(60,8,4,0.72)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    outlineText('CAUGHT!', VIEW_WIDTH / 2, 150, 64, '#ff4d2e');
    text('Farmer Barnaby got his Thanksgiving dinner after all…', VIEW_WIDTH / 2, 208, 19, '#ffe9b0');
    text(`You escaped ${state.stageIndex + 1} stage${state.stageIndex === 0 ? '' : 's'} and scored ${Math.round(state.score)} points.`, VIEW_WIDTH / 2, 244, 18, '#fff');
    text(`Corn grabbed: ${state.corn}   •   Best score: ${Math.max(best, Math.round(state.score))}`, VIEW_WIDTH / 2, 276, 16, '#ffd23e');
    outlineText('PRESS SPACE TO RUN AGAIN', VIEW_WIDTH / 2, 340, 24, '#fff');
  }

  function drawWin(state, best) {
    ctx.fillStyle = 'rgba(8,40,16,0.72)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    outlineText('ESCAPED!', VIEW_WIDTH / 2, 140, 64, '#7be495');
    text('Giblet slipped past the farm, the barn AND the kitchen —', VIEW_WIDTH / 2, 198, 19, '#eaffea');
    text('free in the forest, gobbling happily ever after.', VIEW_WIDTH / 2, 224, 19, '#eaffea');
    text(`Final score: ${Math.round(state.score)}   •   Corn: ${state.corn}   •   Best: ${Math.max(best, Math.round(state.score))}`, VIEW_WIDTH / 2, 268, 18, '#ffd23e');
    outlineText('PRESS SPACE TO ESCAPE AGAIN', VIEW_WIDTH / 2, 336, 24, '#fff');
  }

  function drawStageClear(state) {
    ctx.fillStyle = 'rgba(10,20,8,0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    outlineText('STAGE CLEAR!', VIEW_WIDTH / 2, 220, 52, '#7be495');
    text(`+${500} points — on to ${STAGES[state.stageIndex].name}!`, VIEW_WIDTH / 2, 280, 19, '#fff');
  }

  function draw(state, screen, best, time) {
    const palette = STAGES[state.stageIndex].palette;
    const distance = state.distance;
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best, time);
      return;
    }
    drawSky(palette, distance);
    drawGround(palette, distance);
    const toScreen = (worldX) => 190 + (worldX - distance);
    for (const ob of state.obstacles) {
      const sx = toScreen(ob.x);
      if (sx < -160 || sx > VIEW_WIDTH + 160) continue;
      if (ob.kind === 'fence') drawFence(sx);
      else if (ob.kind === 'haybale') drawHayBale(sx);
      else if (ob.kind === 'haystack') drawHaystack(sx);
      else if (ob.kind === 'oven') drawOven(sx, time);
      else if (ob.kind === 'mud') drawMud(sx);
    }
    for (const pk of state.pickups) {
      if (pk.taken) continue;
      const sx = toScreen(pk.x);
      if (sx < -40 || sx > VIEW_WIDTH + 40) continue;
      if (pk.kind === 'corn') drawCorn(sx, pk.y, time);
      else if (pk.kind === 'pumpkin') drawPumpkin(sx, pk.y, time);
      else if (pk.kind === 'feather') drawFeather(sx, pk.y, time);
      else if (pk.kind === 'heart') drawHeart(sx, pk.y, time);
    }
    for (const knife of state.knives) {
      const sx = toScreen(knife.x);
      if (sx < -60 || sx > VIEW_WIDTH + 60) continue;
      drawKnife(sx, knife.y, knife.kind);
      if (knife.kind === 'falling') {
        ctx.fillStyle = 'rgba(230,57,70,0.35)';
        ctx.beginPath();
        ctx.ellipse(sx + 7, GROUND_Y - 2, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // The farmer runs behind; when the turkey hides, the haystack covers it.
    const hiding = state.turkey.state === TURKEY_STATE.HIDING;
    if (!hiding) drawTurkey(state.turkey, time);
    drawFarmer(state.farmer, time);
    if (hiding) {
      drawTurkey(state.turkey, time);
      const stack = state.obstacles.find(
        (ob) => ob.kind === 'haystack' && ob.x < distance + 60 && ob.x + ob.width > distance,
      );
      if (stack) drawHaystack(toScreen(stack.x));
    }
    drawHud(state, screen);
    if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
    else if (screen === SCREEN_STAGE) drawStageClear(state);
    if (state.stageClearTimer > 0 && screen === SCREEN_PLAY) {
      text(STAGES[state.stageIndex].subtitle, VIEW_WIDTH / 2, 190, 18, '#fff');
    }
  }

  return { draw };
}
