import { CFG } from './config.js';

const OBSTACLES = {
  cone:   { w: 0.9, len: 0.9, cost: 8,  label: '撞上锥桶' },
  truck:  { w: 2.5, len: 6.2, cost: 30, label: '追尾检修车' },
  rubble: { w: 2.9, len: 2.6, cost: 20, label: '撞上碎石堆' },
  mower:  { w: 2.0, len: 4.6, cost: 16, label: '撞上养护车' },
};

const PICKUPS = {
  kit:  { w: 1.0, len: 1.0, label: '应急包', tone: 'repair' },
  fuel: { w: 1.0, len: 1.0, label: '油料',   tone: 'boost' },
  chip: { w: 1.0, len: 1.0, label: '工分',   tone: 'score' },
};

export function obstacleSpec(type) {
  return OBSTACLES[type];
}

export function pickupSpec(type) {
  return PICKUPS[type];
}

export function makeObstacle(type, pos, lane, extra = {}) {
  const s = OBSTACLES[type];
  return {
    type,
    pos,
    lane,
    x: CFG.lanes[lane] + (extra.dx || 0),
    w: s.w,
    len: s.len,
    cost: s.cost,
    vx: extra.vx || 0,
  };
}

export function makePickup(type, pos, lane) {
  const s = PICKUPS[type];
  return { type, pos, lane, x: CFG.lanes[lane], w: s.w, len: s.len, tone: s.tone, label: s.label };
}

function pushObstacle(G, type, pos, lane, extra) {
  G.obstacles.push(makeObstacle(type, pos, lane, extra));
}

// 施工区：碎石堆 + 锥桶 + 养护车，但永远留一条能过的车道
function spawnWorkGroup(G, pos) {
  const lane = Math.floor(Math.random() * 3);
  pushObstacle(G, 'rubble', pos, lane);
  const second = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
  pushObstacle(G, 'cone', pos + 7, second);
  if (Math.random() < 0.6) {
    pushObstacle(G, 'mower', pos + 16, Math.floor(Math.random() * 3), {
      vx: (Math.random() < 0.5 ? -1 : 1) * 1.5,
    });
  }
}

function spawnNormalGroup(G, pos) {
  const d = Math.min(1, G.meters / CFG.finishMeters);
  const roll = Math.random();
  if (roll < 0.3) {
    pushObstacle(G, 'cone', pos, Math.floor(Math.random() * 3));
  } else if (roll < 0.55) {
    pushObstacle(G, 'truck', pos, Math.floor(Math.random() * 3));
  } else if (roll < 0.78 && d > 0.12) {
    // 两车道封死，留一条活路
    const free = Math.floor(Math.random() * 3);
    for (const lane of [0, 1, 2]) {
      if (lane !== free) pushObstacle(G, 'cone', pos + Math.random() * 4, lane);
    }
  } else if (d > 0.3) {
    pushObstacle(G, 'rubble', pos, Math.floor(Math.random() * 3));
  } else {
    pushObstacle(G, 'cone', pos, Math.floor(Math.random() * 3));
  }
}

export function updateSpawns(G) {
  while (G.nextSpawnPos < G.meters + CFG.viewDepth) {
    const nearWork = G.work.start > G.meters && G.work.start - G.meters < 320;
    if (G.work.active || nearWork) {
      spawnWorkGroup(G, G.nextSpawnPos);
    } else {
      spawnNormalGroup(G, G.nextSpawnPos);
    }
    const d = Math.min(1, G.meters / CFG.finishMeters);
    const gap = 60 - 26 * d + (Math.random() * 22 - 6);
    G.nextSpawnPos += Math.max(28, gap);
  }

  while (G.nextPickupPos < G.meters + CFG.viewDepth) {
    const type = ['kit', 'fuel', 'chip'][Math.floor(Math.random() * 3)];
    G.pickups.push(makePickup(type, G.nextPickupPos, Math.floor(Math.random() * 3)));
    G.nextPickupPos += 110 + Math.random() * 170;
  }
}

export function updateObstacleMotion(G, dt) {
  for (const o of G.obstacles) {
    if (!o.vx) continue;
    o.x += o.vx * dt;
    const edge = CFG.roadHalfWidth - o.w / 2 - 0.2;
    if (o.x > edge) { o.x = edge; o.vx = -Math.abs(o.vx); }
    if (o.x < -edge) { o.x = -edge; o.vx = Math.abs(o.vx); }
  }
}
