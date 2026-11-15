import { CFG } from './config.js';
import { G } from './state.js';
import { changeLane, nudgeTarget } from './game.js';

const held = { gas: false, brake: false };

function onKeyDown(e) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeLane(-1);
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeLane(1);
  else if (e.code === 'ArrowUp' || e.code === 'KeyW') held.gas = true;
  else if (e.code === 'ArrowDown' || e.code === 'KeyS') held.brake = true;
}

function onKeyUp(e) {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') held.gas = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') held.brake = false;
}

export function initInput({ start, pause }) {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => { held.gas = false; held.brake = false; });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (G.mode === 'menu' || G.mode === 'over' || G.mode === 'win') start();
    }
    if (e.code === 'KeyP') pause();
  });

  const pad = document.getElementById('touchPad');
  if (pad) {
    pad.querySelectorAll('[data-act]').forEach((btn) => {
      const act = btn.dataset.act;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        if (act === 'left') changeLane(-1);
        else if (act === 'right') changeLane(1);
        else if (act === 'gas') held.gas = true;
        else if (act === 'brake') held.brake = true;
      });
      const release = (e) => {
        if (e && e.pointerId !== undefined && btn.hasPointerCapture?.(e.pointerId)) btn.releasePointerCapture(e.pointerId);
        if (act === 'gas') held.gas = false;
        if (act === 'brake') held.brake = false;
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);
    });
  }

  // 画面滑动：左右换道，上滑加速，下滑刹车
  const canvas = document.getElementById('game');
  if (canvas) {
    let sx = 0;
    let sy = 0;
    let used = false;
    canvas.addEventListener('pointerdown', (e) => {
      sx = e.clientX;
      sy = e.clientY;
      used = false;
    });
    canvas.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (used) return;
      if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) {
        changeLane(dx > 0 ? 1 : -1);
        used = true;
      } else if (dy < -26) {
        held.gas = true;
        setTimeout(() => { held.gas = false; }, 700);
        used = true;
      } else if (dy > 26) {
        held.brake = true;
        setTimeout(() => { held.brake = false; }, 500);
        used = true;
      }
    });
  }
}

export function pollInput(dt) {
  if (G.mode !== 'playing') return;
  if (held.gas) nudgeTarget(CFG.targetRate * dt);
  if (held.brake) nudgeTarget(-CFG.targetRate * 1.4 * dt);
}

export function isTouchDevice() {
  return typeof window !== 'undefined'
    && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);
}
