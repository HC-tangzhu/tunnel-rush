import test from 'node:test';
import assert from 'node:assert/strict';
import { G, resetGame } from '../js/state.js';
import { update, autopilot, rating, setLane } from '../js/game.js';
import { CFG } from '../js/config.js';

function run(seconds, onStep) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps && G.mode === 'playing'; i += 1) {
    if (onStep) onStep(i);
    update(1 / 60);
  }
}

test('自动驾驶能跑完 3000 m 并判定贯通', () => {
  resetGame();
  G.mode = 'playing';
  G.autoplay = true;
  let guard = 0;
  while (G.mode === 'playing' && guard < 60 * 60 * 20) {
    autopilot();
    update(1 / 60);
    guard += 1;
  }
  assert.equal(G.mode, 'win', '自动巡航应当贯通终点');
  assert.ok(G.meters >= CFG.finishMeters, `里程应达到 ${CFG.finishMeters}`);
  assert.ok(guard < 60 * 60 * 20, '模拟不应卡死');
  assert.equal(rating().grade !== 'D', true);
});

test('撞上障碍物会掉车况并减速', () => {
  resetGame();
  G.mode = 'playing';
  G.obstacles = [{
    type: 'cone', pos: G.meters + 6, lane: 1, x: 0, w: 0.9, len: 0.9, cost: 8, vx: 0,
  }];
  G.playerX = 0;
  const before = G.cond;
  run(3);
  assert.ok(G.cond < before, '应扣车况');
  assert.ok(G.hits >= 1, '应记录碰撞次数');
});

test('施工区把限速降到 40，测速按当时限速判定', () => {
  resetGame();
  G.mode = 'playing';
  G.work.announced = true;
  G.work.start = G.meters + 10;
  G.work.end = G.work.start + CFG.workZoneLength;
  run(2);
  assert.equal(G.work.active, true, '应进入施工区');
  assert.equal(G.limit, CFG.limitWork, '施工区限速应为 40 km/h');
});

test('超速会被摄像头抓拍并扣分', () => {
  resetGame();
  G.mode = 'playing';
  G.speed = CFG.maxSpeed;
  G.target = CFG.maxSpeed;
  G.nextCameraAt = 20;
  run(6);
  assert.ok(G.violations >= 1, '超速应被记录违规');
  assert.ok(G.score < G.meters, '违规应扣分');
});

test('车况归零判负', () => {
  resetGame();
  G.mode = 'playing';
  G.cond = 5;
  G.obstacles = [{
    type: 'truck', pos: G.meters + 4, lane: 1, x: 0, w: 2.5, len: 6.2, cost: 30, vx: 0,
  }];
  run(2);
  assert.equal(G.mode, 'over', '车况归零应结束');
  assert.equal(rating().grade, 'D');
});

test('变道不会越界', () => {
  resetGame();
  setLane(-5);
  assert.equal(G.lane, 0);
  setLane(9);
  assert.equal(G.lane, 2);
});
