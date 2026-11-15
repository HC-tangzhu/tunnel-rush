import { G, resetGame } from './state.js';
import { update, autopilot } from './game.js';
import { fitCanvas, render } from './render.js';
import { initHud, updateHud, showScreen } from './hud.js';
import { initInput, pollInput, isTouchDevice } from './input.js';
import { initAudio, resumeAudio, sfx, engine, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
let ctx = null;
let lastTs = 0;
let lastMode = '';

function startGame() {
  resetGame();
  G.mode = 'playing';
  initAudio();
  resumeAudio();
  sfx('start');
  showScreen('playing');
}

function pauseGame() {
  if (G.mode === 'playing') {
    G.mode = 'paused';
    showScreen('paused');
  } else if (G.mode === 'paused') {
    G.mode = 'playing';
    showScreen('playing');
  }
}

function frame(ts) {
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
  lastTs = ts;

  if (G.mode === 'playing') {
    if (G.autoplay) autopilot();
    else pollInput(dt);
    update(dt);
  }

  render(ctx, ts / 1000);
  updateHud();
  engine(G.speed, G.mode === 'playing');

  if (G.mode !== lastMode) {
    lastMode = G.mode;
    showScreen(G.mode);
  }
  requestAnimationFrame(frame);
}

function boot() {
  ctx = fitCanvas(canvas);
  initHud();
  initInput({ start: startGame, pause: pauseGame });

  document.getElementById('startBtn')?.addEventListener('click', startGame);
  document.getElementById('againBtn')?.addEventListener('click', startGame);
  document.getElementById('muteBtn')?.addEventListener('click', (e) => {
    initAudio();
    e.currentTarget.textContent = toggleMute() ? '🔇' : '🔊';
  });

  const pad = document.getElementById('touchPad');
  if (pad && !isTouchDevice()) pad.style.display = 'none';

  const refit = () => { ctx = fitCanvas(canvas); };
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', () => setTimeout(refit, 250));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.mode === 'playing') pauseGame();
  });

  resetGame();
  const params = new URLSearchParams(location.search);
  if (params.get('autoplay') === '1' || params.get('auto') === '1') {
    G.autoplay = true;
    startGame();
  } else {
    showScreen('menu');
  }

  window.__GAME = G;
  requestAnimationFrame(frame);
}

boot();
