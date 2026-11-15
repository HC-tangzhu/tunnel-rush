import { CFG } from './config.js';
import { G } from './state.js';

const el = {};

export function initHud() {
  el.hud = document.getElementById('hud');
  el.meters = document.getElementById('meters');
  el.speed = document.getElementById('speed');
  el.limitTag = document.getElementById('limitTag');
  el.chips = document.getElementById('chips');
  el.viol = document.getElementById('viol');
  el.condFill = document.getElementById('condFill');
  el.condText = document.getElementById('condText');
  el.toast = document.getElementById('toast');
  el.menu = document.getElementById('menu');
  el.result = document.getElementById('result');
  el.pauseVeil = document.getElementById('pauseVeil');
  el.touch = document.getElementById('touchPad');
  el.resTitle = document.getElementById('resTitle');
  el.resGrade = document.getElementById('resGrade');
  el.resLabel = document.getElementById('resLabel');
  el.resStats = document.getElementById('resStats');
}

export function updateHud() {
  if (!el.hud) return;
  el.meters.textContent = Math.round(G.meters);
  el.speed.textContent = Math.round(G.speed * 3.6);
  const over = G.speed > G.limit + 0.25;
  el.speed.classList.toggle('over', over);
  el.limitTag.textContent = `限速 ${Math.round(G.limit * 3.6)}`;
  el.limitTag.classList.toggle('warn', G.work.active);
  el.chips.textContent = String(G.chips);
  el.viol.textContent = String(G.violations);
  const cond = Math.max(0, Math.round(G.cond));
  el.condFill.style.width = `${cond}%`;
  el.condFill.classList.toggle('danger', cond < 35);
  el.condText.textContent = `车况 ${cond}`;

  if (G.toast && G.time < G.toast.until) {
    el.toast.textContent = G.toast.text;
    el.toast.dataset.tone = G.toast.tone;
    el.toast.classList.add('show');
  } else {
    el.toast.classList.remove('show');
  }
}

function statRow(label, value) {
  return `<div class="stat"><span>${label}</span><b>${value}</b></div>`;
}

export function showScreen(mode) {
  const playing = mode === 'playing';
  el.menu.hidden = mode !== 'menu';
  el.result.hidden = mode !== 'over' && mode !== 'win';
  el.hud.hidden = mode === 'menu';
  el.pauseVeil.hidden = mode !== 'paused';
  if (el.touch) el.touch.hidden = !playing;

  if (mode === 'over' || mode === 'win') {
    const r = G.rating || { grade: 'D', label: '未贯通' };
    el.resTitle.textContent = mode === 'win' ? '安全贯通！' : '车况归零，作业中止';
    el.resGrade.textContent = r.grade;
    el.resGrade.dataset.grade = r.grade;
    el.resLabel.textContent = r.label;
    el.resStats.innerHTML = [
      statRow('贯通里程', `${Math.round(G.meters)} m / ${CFG.finishMeters} m`),
      statRow('最终得分', Math.max(0, Math.round(G.score))),
      statRow('工分', G.chips),
      statRow('超速违规', G.violations),
      statRow('碰撞次数', G.hits),
      statRow('剩余车况', `${Math.max(0, Math.round(G.cond))}`),
    ].join('');
  }
}
