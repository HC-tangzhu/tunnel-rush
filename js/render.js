import { CFG } from './config.js';
import { G } from './state.js';

export const view = { W: 0, H: 0, ppm: 1, dpr: 1 };

const C = {
  void0: '#04060a',
  void1: '#0a0f16',
  roadTop: '#12161d',
  roadBottom: '#171b22',
  walk: '#262c34',
  wall: '#333b45',
  seam: 'rgba(255,255,255,0.05)',
  edgeLine: 'rgba(226,232,240,0.5)',
  dash: 'rgba(235,240,248,0.6)',
  cone: '#ff7a2f',
  truck: '#f2c14e',
  rubble: '#6b7280',
  mower: '#3fbf7f',
  red: '#ff4d4f',
  blue: '#4aa3ff',
  gold: '#ffd75e',
  kit: '#ff6b6b',
};

export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(300, Math.round(rect.width || window.innerWidth));
  const h = Math.max(420, Math.round(rect.height || window.innerHeight));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  view.W = w;
  view.H = h;
  view.dpr = dpr;
  view.ppm = (w * 0.39) / (CFG.roadHalfWidth + CFG.walkwayWidth);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function proj(z) {
  const t = z / (z + 45);
  const horizon = view.H * CFG.horizonRatio;
  const playerY = view.H * CFG.playerYRatio;
  return { t, y: playerY - t * (playerY - horizon), s: 1 - 0.62 * t };
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function drawVoid(ctx) {
  const { W, H } = view;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#020406');
  g.addColorStop(0.22, '#070b11');
  g.addColorStop(0.6, '#0b1119');
  g.addColorStop(1, '#10161e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawTunnel(ctx) {
  const { W, H, ppm } = view;
  const cx = W / 2;
  const roadHalf = CFG.roadHalfWidth * ppm;
  const tunHalf = (CFG.roadHalfWidth + CFG.walkwayWidth) * ppm;
  const far = proj(CFG.viewDepth + 140);
  const sF = far.s;

  // 侧墙：一直填到屏幕两侧，读起来才像“身在洞内”
  ctx.fillStyle = '#4a5462';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(cx - tunHalf, H);
  ctx.lineTo(cx - tunHalf * sF, far.y);
  ctx.lineTo(0, far.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, H);
  ctx.lineTo(cx + tunHalf, H);
  ctx.lineTo(cx + tunHalf * sF, far.y);
  ctx.lineTo(W, far.y);
  ctx.closePath();
  ctx.fill();

  // 侧壁壁板缝 + 底脚黄线
  ctx.strokeStyle = 'rgba(10,14,20,0.55)';
  ctx.lineWidth = 1;
  for (let z = 4; z <= CFG.viewDepth + 140; z += 4) {
    const p = proj(z);
    const a = 1 - p.t;
    ctx.globalAlpha = 0.85 * a;
    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(cx - tunHalf * p.s, p.y);
    ctx.moveTo(W, p.y);
    ctx.lineTo(cx + tunHalf * p.s, p.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const side of [-1, 1]) {
    ctx.strokeStyle = 'rgba(240,190,60,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + side * tunHalf * sF, far.y);
    ctx.lineTo(cx + side * tunHalf, H);
    ctx.stroke();
  }

  // 电缆桥架
  ctx.strokeStyle = 'rgba(12,16,22,0.9)';
  ctx.lineWidth = Math.max(1, 3 * (1 - sF * 0.5));
  ctx.beginPath();
  ctx.moveTo(cx - (CFG.roadHalfWidth + CFG.walkwayWidth + 0.55) * ppm, H);
  ctx.lineTo(cx - (CFG.roadHalfWidth + CFG.walkwayWidth + 0.55) * ppm * sF, far.y);
  ctx.moveTo(cx + (CFG.roadHalfWidth + CFG.walkwayWidth + 0.55) * ppm, H);
  ctx.lineTo(cx + (CFG.roadHalfWidth + CFG.walkwayWidth + 0.55) * ppm * sF, far.y);
  ctx.stroke();

  // 检修道
  ctx.fillStyle = C.walk;
  ctx.beginPath();
  ctx.moveTo(cx - tunHalf, H);
  ctx.lineTo(cx - roadHalf, H);
  ctx.lineTo(cx - roadHalf * sF, far.y);
  ctx.lineTo(cx - tunHalf * sF, far.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + tunHalf, H);
  ctx.lineTo(cx + roadHalf, H);
  ctx.lineTo(cx + roadHalf * sF, far.y);
  ctx.lineTo(cx + tunHalf * sF, far.y);
  ctx.closePath();
  ctx.fill();

  // 路面
  const g = ctx.createLinearGradient(0, far.y, 0, H);
  g.addColorStop(0, C.roadTop);
  g.addColorStop(0.6, C.roadBottom);
  g.addColorStop(1, '#12161c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - roadHalf, H);
  ctx.lineTo(cx - roadHalf * sF, far.y);
  ctx.lineTo(cx + roadHalf * sF, far.y);
  ctx.lineTo(cx + roadHalf, H);
  ctx.closePath();
  ctx.fill();


  // 路缘轮廓标
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let z = 0; z <= CFG.viewDepth + 60; z += 12) {
    const p = proj(z);
    const x = cx - (CFG.roadHalfWidth + 0.35) * ppm * p.s;
    const w = Math.max(1, 3 * p.s);
    ctx.fillRect(x, p.y - w, w, w * 1.6);
    ctx.fillRect(cx + (CFG.roadHalfWidth + 0.35) * ppm * p.s - w, p.y - w, w, w * 1.6);
  }
}

function drawLaneMarks(ctx) {
  const { W, H, ppm } = view;
  const cx = W / 2;
  const far = proj(CFG.viewDepth + 140);

  for (const sign of [-1, 1]) {
    ctx.strokeStyle = C.edgeLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + sign * CFG.roadHalfWidth * ppm, H);
    ctx.lineTo(cx + sign * CFG.roadHalfWidth * ppm * far.s, far.y);
    ctx.stroke();
  }

  const period = 12;
  const k0 = Math.floor(G.meters / period);
  for (const xm of [-1.75, 1.75]) {
    for (let k = k0; k <= k0 + (CFG.viewDepth + 60) / period; k += 1) {
      const z0 = k * period - G.meters;
      const z1 = z0 + 6;
      if (z1 < 0 || z0 > CFG.viewDepth + 60) continue;
      const p0 = proj(Math.max(z0, 0));
      const p1 = proj(z1);
      ctx.strokeStyle = C.dash;
      ctx.lineWidth = Math.max(1, 2.6 * p0.s);
      ctx.beginPath();
      ctx.moveTo(cx + xm * ppm * p0.s, p0.y);
      ctx.lineTo(cx + xm * ppm * p1.s, p1.y);
      ctx.stroke();
    }
  }
}

function drawLamps(ctx) {
  const { W, ppm } = view;
  const cx = W / 2;
  const spacing = 25;
  const k0 = Math.floor(G.meters / spacing);
  for (let k = k0; k <= k0 + (CFG.viewDepth + 60) / spacing; k += 1) {
    const z = k * spacing - G.meters;
    if (z < 0 || z > CFG.viewDepth + 60) continue;
    const p = proj(z);
    const half = CFG.roadHalfWidth * ppm * p.s;
    const alpha = 0.85 * (1 - p.t * 0.85);

    // 路面光斑
    const pool = ctx.createRadialGradient(cx, p.y, 0, cx, p.y, half * 1.15);
    pool.addColorStop(0, `rgba(255,238,190,${0.16 * alpha})`);
    pool.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(cx, p.y, half * 1.15, Math.max(2, 16 * p.s), 0, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createLinearGradient(0, p.y - 8 * p.s, 0, p.y + 30 * p.s);
    g.addColorStop(0, `rgba(255,236,180,${0.3 * alpha})`);
    g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - half, p.y - 8 * p.s, half * 2, 38 * p.s);
    ctx.fillStyle = `rgba(255,248,220,${alpha})`;
    ctx.fillRect(cx - half * 0.5, p.y - 5 * p.s, half, Math.max(1, 2.6 * p.s));
  }
}

function drawWallProps(ctx, time) {
  const { W, ppm } = view;
  const cx = W / 2;
  const tunHalf = (CFG.roadHalfWidth + CFG.walkwayWidth) * ppm;

  const spacing = 100;
  const k0 = Math.floor(G.meters / spacing);
  for (let k = k0; k <= k0 + (CFG.viewDepth + 60) / spacing; k += 1) {
    const m = k * spacing;
    const z = m - G.meters;
    if (z < 0 || z > CFG.viewDepth + 60) continue;
    const p = proj(z);
    const km = Math.floor(m / 1000);
    const rem = m - km * 1000;
    const x = cx - tunHalf * p.s + 9 * p.s;
    ctx.fillStyle = `rgba(226,232,240,${0.55 * (1 - p.t)})`;
    ctx.font = `${Math.max(6, 10 * p.s)}px ui-monospace, SFMono-Regular, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`K${km}+${String(rem).padStart(3, '0')}`, x, p.y);
  }

  for (const cam of G.cameras) {
    const z = cam.pos - G.meters;
    if (z < -6 || z > CFG.viewDepth + 60) continue;
    const p = proj(z);
    const x = cx - tunHalf * p.s + 6 * p.s;
    const w = 13 * p.s;
    const h = 7 * p.s;
    ctx.fillStyle = '#10151b';
    ctx.fillRect(x, p.y - h, w, h);
    ctx.fillStyle = G.flash > 0.15 ? C.red : '#7c8794';
    circle(ctx, x + w * 0.78, p.y - h * 0.5, Math.max(0.8, 2.2 * p.s));
    ctx.fill();
  }

  for (const sign of G.signs) {
    const z = sign.pos - G.meters;
    if (z < -6 || z > CFG.viewDepth + 60) continue;
    const p = proj(z);
    const r = 12 * p.s;
    for (const side of [-1, 1]) {
      const x = cx + side * (tunHalf * p.s - r - 4 * p.s);
      ctx.fillStyle = '#f2f4f8';
      circle(ctx, x, p.y - r * 1.6, r);
      ctx.fill();
      ctx.strokeStyle = '#d0342c';
      ctx.lineWidth = Math.max(1, 2.4 * p.s);
      ctx.stroke();
      ctx.fillStyle = '#16191f';
      ctx.font = `700 ${Math.max(6, r * 1.05)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(sign.limit * 3.6)), x, p.y - r * 1.6);
    }
  }

  if (G.work.active) {
    ctx.fillStyle = `rgba(255,196,64,${0.5 + 0.3 * Math.sin(time * 5)})`;
    ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('施工区 · 限速 40', cx, 10);
  }
}

function drawObstacle(ctx, o, time) {
  const { W, ppm } = view;
  const cx = W / 2;
  const p = proj(o.pos - G.meters);
  const x = cx + o.x * ppm * p.s;

  if (o.type === 'cone') {
    const w = o.w * ppm * p.s;
    const h = 0.95 * ppm * p.s;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, p.y, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.cone;
    ctx.beginPath();
    ctx.moveTo(x, p.y - h);
    ctx.lineTo(x + w * 0.5, p.y);
    ctx.lineTo(x - w * 0.5, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x - w * 0.26, p.y - h * 0.5, w * 0.52, Math.max(1, h * 0.16));
  } else if (o.type === 'truck') {
    const pFar = proj(o.pos - G.meters - o.len / 2);
    const pNear = proj(o.pos - G.meters + o.len / 2);
    const w = o.w * ppm * p.s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x - w / 2, pNear.y - 2, w, 4);
    ctx.fillStyle = C.truck;
    ctx.fillRect(x - w / 2, pFar.y, w, pNear.y - pFar.y);
    ctx.fillStyle = '#39404b';
    ctx.fillRect(x - w * 0.42, pFar.y + 2, w * 0.84, Math.max(2, (pNear.y - pFar.y) * 0.26));
    ctx.fillStyle = 'rgba(30,34,40,0.85)';
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(x - w * 0.42, pNear.y - 5 - i * 6, w * 0.84, 2.4);
    }
    ctx.fillStyle = '#ffd75e';
    circle(ctx, x - w * 0.3, pFar.y + 6, Math.max(1.4, 3 * p.s));
    ctx.fill();
    circle(ctx, x + w * 0.3, pFar.y + 6, Math.max(1.4, 3 * p.s));
    ctx.fill();
  } else if (o.type === 'rubble') {
    const w = o.w * ppm * p.s;
    const h = 1.1 * ppm * p.s;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, p.y, w * 0.5, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i += 1) {
      const rx = ((i * 37) % 100) / 100 - 0.5;
      const ry = ((i * 61) % 100) / 100 - 0.5;
      const r = (0.22 + ((i * 17) % 40) / 100) * w;
      ctx.fillStyle = i % 2 ? C.rubble : '#565d68';
      ctx.beginPath();
      ctx.moveTo(x + rx * w - r, p.y);
      ctx.lineTo(x + rx * w, p.y - r * 1.1);
      ctx.lineTo(x + rx * w + r, p.y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (o.type === 'mower') {
    const pFar = proj(o.pos - G.meters - o.len / 2);
    const pNear = proj(o.pos - G.meters + o.len / 2);
    const w = o.w * ppm * p.s;
    ctx.fillStyle = C.mower;
    ctx.fillRect(x - w / 2, pFar.y, w, pNear.y - pFar.y);
    ctx.fillStyle = '#26543c';
    ctx.fillRect(x - w / 2, pFar.y, w, Math.max(2, (pNear.y - pFar.y) * 0.35));
    const pulse = 0.35 + 0.45 * Math.abs(Math.sin(time * 6));
    ctx.fillStyle = `rgba(255,180,40,${pulse})`;
    circle(ctx, x, pFar.y + 6, Math.max(1.5, 3.6 * p.s));
    ctx.fill();
  }
}

function drawPickups(ctx, p, time) {
  const { W, ppm } = view;
  const cx = W / 2;
  const pr = proj(p.pos - G.meters);
  const bob = Math.sin(time * 4 + p.pos) * 2 * pr.s;
  const x = cx + p.x * ppm * pr.s;
  const y = pr.y - bob;
  const r = 0.55 * ppm * pr.s;

  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  const tone = p.tone === 'repair' ? '255,107,107' : p.tone === 'boost' ? '74,163,255' : '255,215,94';
  glow.addColorStop(0, `rgba(${tone},0.45)`);
  glow.addColorStop(1, `rgba(${tone},0)`);
  ctx.fillStyle = glow;
  circle(ctx, x, y, r * 2.6);
  ctx.fill();

  if (p.tone === 'repair') {
    ctx.fillStyle = C.kit;
    roundRect(ctx, x - r, y - r, r * 2, r * 2, r * 0.3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - r * 0.18, y - r * 0.62, r * 0.36, r * 1.24);
    ctx.fillRect(x - r * 0.62, y - r * 0.18, r * 1.24, r * 0.36);
  } else if (p.tone === 'boost') {
    ctx.fillStyle = C.blue;
    roundRect(ctx, x - r * 0.8, y - r, r * 1.6, r * 2, r * 0.25);
    ctx.fill();
    ctx.fillStyle = '#eaf4ff';
    ctx.fillRect(x - r * 0.3, y - r * 0.55, r * 0.6, r * 1.1);
  } else {
    ctx.fillStyle = C.gold;
    circle(ctx, x, y, r);
    ctx.fill();
    ctx.fillStyle = '#5a3d00';
    ctx.font = `700 ${Math.max(6, r * 1.3)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('工', x, y + 0.5);
  }
}

function drawPlayer(ctx, time) {
  const { W, H, ppm } = view;
  const cx = W / 2 + G.playerX * ppm;
  const y = H * CFG.playerYRatio;
  const w = 1.95 * ppm;
  const l = 4.6 * ppm;
  const drift = Math.max(-0.13, Math.min(0.13, (G.targetX - G.playerX) * 0.06));

  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(drift);

  // 车灯光锥
  const beam = ctx.createLinearGradient(0, -l, 0, -l * 3.0);
  beam.addColorStop(0, 'rgba(255,244,200,0.14)');
  beam.addColorStop(1, 'rgba(255,244,200,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -l * 0.5);
  ctx.lineTo(-w * 1.35, -l * 3.0);
  ctx.lineTo(w * 1.35, -l * 3.0);
  ctx.lineTo(w * 0.36, -l * 0.5);
  ctx.closePath();
  ctx.fill();

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, -w / 2 + 2, -l / 2 + 3, w, l, w * 0.3);
  ctx.fill();

  // 车身
  const body = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  body.addColorStop(0, '#2b7fd4');
  body.addColorStop(0.45, '#5fb3ff');
  body.addColorStop(1, '#2b7fd4');
  ctx.fillStyle = body;
  roundRect(ctx, -w / 2, -l / 2, w, l, w * 0.3);
  ctx.fill();

  // 挡风玻璃与车顶
  ctx.fillStyle = 'rgba(12,22,34,0.9)';
  roundRect(ctx, -w * 0.36, -l * 0.34, w * 0.72, l * 0.22, w * 0.12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(ctx, -w * 0.3, l * 0.05, w * 0.6, l * 0.16, w * 0.08);
  ctx.fill();

  // 车头灯 / 尾灯
  ctx.fillStyle = '#fff6cf';
  ctx.fillRect(-w * 0.4, -l * 0.47, w * 0.22, 3);
  ctx.fillRect(w * 0.18, -l * 0.47, w * 0.22, 3);
  ctx.fillStyle = '#ff5a5a';
  ctx.fillRect(-w * 0.4, l * 0.45, w * 0.22, 3);
  ctx.fillRect(w * 0.18, l * 0.45, w * 0.22, 3);

  // 冲刺尾焰
  if (G.boost > 0) {
    const flame = 0.6 + 0.4 * Math.sin(time * 22);
    ctx.fillStyle = `rgba(255,170,60,${0.75 * flame})`;
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, l * 0.48);
    ctx.lineTo(0, l * (0.48 + 0.42 * flame));
    ctx.lineTo(w * 0.32, l * 0.48);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSpeedFx(ctx, time) {
  const { W, H, ppm } = view;
  const ratio = G.speed / CFG.maxSpeed;
  if (ratio < 0.62) return;
  const alpha = (ratio - 0.62) * 0.7;
  const cx = W / 2;
  const roadHalf = CFG.roadHalfWidth * ppm;
  ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.35})`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = cx + side * (roadHalf + 12 + ((i * 53) % 70));
    const len = 40 + ((i * 29) % 70);
    const y = ((time * 900 + i * 120) % (H + 200)) - 100;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len);
    ctx.stroke();
  }
}

function drawFlash(ctx) {
  if (G.flash <= 0) return;
  const { W, H } = view;
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(255,40,40,0)');
  g.addColorStop(1, `rgba(255,40,40,${0.45 * G.flash})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function render(ctx, time) {
  if (!view.W) return;
  ctx.save();
  if (G.shake > 0) {
    const s = G.shake * 6;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawVoid(ctx);
  drawTunnel(ctx);
  drawLaneMarks(ctx);
  drawLamps(ctx);
  drawWallProps(ctx, time);
  for (const p of G.pickups) {
    const z = p.pos - G.meters;
    if (z < -6 || z > CFG.viewDepth + 60) continue;
    drawPickups(ctx, p, time);
  }
  for (const o of G.obstacles) {
    const z = o.pos - G.meters;
    if (z < -10 || z > CFG.viewDepth + 60) continue;
    drawObstacle(ctx, o, time);
  }
  drawPlayer(ctx, time);
  drawSpeedFx(ctx, time);
  ctx.restore();
  drawFlash(ctx);
  drawVignette(ctx);
}

function drawVignette(ctx) {
  const { W, H } = view;
  const g = ctx.createRadialGradient(W / 2, H * 0.52, Math.min(W, H) * 0.4, W / 2, H * 0.52, Math.max(W, H) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
