import { CFG } from './config.js';
import { G, currentLimit, say } from './state.js';
import { updateSpawns, updateObstacleMotion, obstacleSpec } from './entities.js';
import { sfx } from './audio.js';

export function setLane(lane) {
  const next = Math.max(0, Math.min(2, lane));
  if (next === G.lane) return;
  G.lane = next;
  G.targetX = CFG.lanes[next];
}

export function changeLane(dir) {
  setLane(G.lane + dir);
}

export function nudgeTarget(delta) {
  G.target = Math.max(0, Math.min(CFG.maxSpeed, G.target + delta));
}

function updateEvents() {
  if (!G.work.announced && G.meters >= G.nextWorkAt) {
    G.work.announced = true;
    G.work.start = G.meters + 260;
    G.work.end = G.work.start + CFG.workZoneLength;
    const [wlo, whi] = CFG.workSpacing;
    G.nextWorkAt = G.work.end + wlo + Math.random() * (whi - wlo);
    G.signs.push({ pos: G.work.start - 12, limit: CFG.limitWork });
    say(`前方 ${Math.round(G.work.start - G.meters)}m 施工区 · 限速 40`, 'warn', 3);
  }
  G.work.active = G.meters >= G.work.start && G.meters < G.work.end;
  G.limit = currentLimit();

  while (G.meters >= G.nextCameraAt) {
    G.cameras.push({ pos: G.nextCameraAt });
    if (G.speed > G.limit + 0.25) {
      const kmh = Math.round(G.speed * 3.6);
      G.violations += 1;
      G.score = Math.max(0, G.score - CFG.violationPenalty);
      G.flash = 1;
      say(`测速抓拍 ${kmh} km/h · 罚 ${CFG.violationPenalty} 分`, 'bad', 2.6);
      sfx('violation');
    } else {
      sfx('pass');
    }
    const [lo, hi] = CFG.cameraSpacing;
    G.nextCameraAt += lo + Math.random() * (hi - lo);
  }
}

function hitObstacle(o) {
  const speedFactor = 0.6 + (G.speed / CFG.maxSpeed) * 0.5;
  const damage = Math.round(o.cost * speedFactor);
  G.cond -= damage;
  G.speed *= 0.45;
  G.target = Math.min(G.target, 11);
  G.shake = 1;
  G.hits += 1;
  G.grace = CFG.hitGrace;
  sfx('crash');
  say(`${obstacleSpec(o.type).label} · 车况 -${damage}`, 'bad', 1.8);
}

function collectPickup(p) {
  if (p.tone === 'repair') {
    G.cond = Math.min(CFG.startCondition, G.cond + 30);
    say('应急包 · 车况 +30', 'good', 1.6);
  } else if (p.tone === 'boost') {
    G.boost = 4;
    say('油料 · 4 秒冲刺（小心超速）', 'good', 1.8);
  } else {
    G.chips += 1;
    G.score += 120;
    say('工分 +120', 'good', 1.4);
  }
  sfx('pickup');
}

function checkCollisions() {
  for (let i = G.obstacles.length - 1; i >= 0; i -= 1) {
    const o = G.obstacles[i];
    const z = o.pos - G.meters;
    const overlapZ = z - o.len / 2 < 2.2 && z + o.len / 2 > -2.2;
    const overlapX = Math.abs(G.playerX - o.x) < o.w / 2 + 0.85;
    if (overlapZ && overlapX) {
      if (G.grace > 0) {
        G.obstacles.splice(i, 1);
        continue;
      }
      hitObstacle(o);
      G.obstacles.splice(i, 1);
      if (G.cond <= 0) {
        G.cond = 0;
        endRun('over');
        return;
      }
    }
  }

  for (let i = G.pickups.length - 1; i >= 0; i -= 1) {
    const p = G.pickups[i];
    const z = p.pos - G.meters;
    if (Math.abs(z) < 2.4 && Math.abs(G.playerX - p.x) < 1.5) {
      collectPickup(p);
      G.pickups.splice(i, 1);
    }
  }
}

function cullBehind() {
  for (let i = G.obstacles.length - 1; i >= 0; i -= 1) {
    if (G.obstacles[i].pos - G.meters < -18) G.obstacles.splice(i, 1);
  }
  for (let i = G.pickups.length - 1; i >= 0; i -= 1) {
    if (G.pickups[i].pos - G.meters < -18) G.pickups.splice(i, 1);
  }
  for (let i = G.cameras.length - 1; i >= 0; i -= 1) {
    if (G.cameras[i].pos - G.meters < -20) G.cameras.splice(i, 1);
  }
  for (let i = G.signs.length - 1; i >= 0; i -= 1) {
    if (G.signs[i].pos - G.meters < -20) G.signs.splice(i, 1);
  }
}

export function rating() {
  if (G.meters < CFG.finishMeters) return { grade: 'D', label: '未贯通' };
  if (G.violations === 0 && G.cond >= 80) return { grade: 'S', label: '零违规 · 全勤车况' };
  if (G.violations <= 2) return { grade: 'A', label: '合规冲刺' };
  return { grade: 'B', label: '安全贯通' };
}

function endRun(mode) {
  G.mode = mode;
  G.finalScore = Math.max(0, Math.round(G.score));
  G.rating = rating();
  sfx(mode === 'win' ? 'win' : 'lose');
}

export function update(dt) {
  if (G.mode !== 'playing') return;
  G.time += dt;
  G.grace = Math.max(0, G.grace - dt);
  G.boost = Math.max(0, G.boost - dt);
  G.shake = Math.max(0, G.shake - dt * 3.2);
  G.flash = Math.max(0, G.flash - dt * 2.4);

  const diff = G.target - G.speed;
  const rate = diff > 0 ? CFG.accel : CFG.brake;
  G.speed += Math.max(-rate * dt, Math.min(rate * dt, diff));
  G.speed = Math.max(0, Math.min(CFG.maxSpeed, G.speed));

  const dist = G.speed * dt;
  G.meters += dist;
  G.score += dist * (G.boost > 0 ? 1.6 : 1);

  G.playerX += (G.targetX - G.playerX) * Math.min(1, dt * 9);

  updateEvents();
  updateSpawns(G);
  updateObstacleMotion(G, dt);
  checkCollisions();
  cullBehind();

  if (G.mode === 'playing' && G.meters >= CFG.finishMeters) {
    endRun('win');
  }
}

// 自动驾驶：给冒烟测试和无手操场景用
export function autopilot() {
  const limit = currentLimit();
  const clearance = [Infinity, Infinity, Infinity];
  for (const o of G.obstacles) {
    const z = o.pos - G.meters;
    if (z < -4 || z > 110) continue;
    for (let lane = 0; lane < 3; lane += 1) {
      if (Math.abs(CFG.lanes[lane] - o.x) < o.w / 2 + 1.3) {
        clearance[lane] = Math.min(clearance[lane], z);
      }
    }
  }

  const cur = G.lane;
  let target = cur;
  if (clearance[cur] < 50) {
    let best = cur;
    let bestC = clearance[cur];
    for (let lane = 0; lane < 3; lane += 1) {
      if (lane === cur) continue;
      if (clearance[lane] > bestC + 8) {
        bestC = clearance[lane];
        best = lane;
      }
    }
    target = best;
  }
  setLane(target);

  const nearest = Math.min(clearance[0], clearance[1], clearance[2]);
  let cap = limit * 0.95;
  if (nearest < 32) cap = Math.min(cap, Math.max(9, nearest * 0.85));
  G.target = cap;
}
