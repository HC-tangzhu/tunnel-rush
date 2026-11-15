import { CFG } from './config.js';

export const G = {};

export function freshState() {
  return {
    mode: 'menu',          // menu | playing | over | win | paused
    meters: 0,
    speed: CFG.startSpeed,
    target: CFG.startSpeed,
    cond: CFG.startCondition,
    score: 0,
    chips: 0,
    violations: 0,
    lane: 1,
    playerX: 0,
    targetX: 0,
    obstacles: [],         // { type, pos, lane, x, w, len, cost }
    pickups: [],
    cameras: [],           // { pos }
    signs: [],             // { pos, limit }
    nextSpawnPos: 120,
    nextPickupPos: 200,
    nextCameraAt: 620,
    nextWorkAt: 1150,
    work: { active: false, start: 0, end: 0, announced: false },
    limit: CFG.limitNormal,
    boost: 0,
    grace: 0,
    shake: 0,
    flash: 0,
    toast: null,           // { text, tone, until }
    time: 0,
    hits: 0,
    autoplay: false,
  };
}

export function resetGame() {
  const autoplay = G.autoplay === true;
  Object.assign(G, freshState(), { autoplay });
}

export function currentLimit() {
  return G.work.active ? CFG.limitWork : CFG.limitNormal;
}

export function say(text, tone = 'info', seconds = 2.2) {
  G.toast = { text, tone, until: G.time + seconds };
}
