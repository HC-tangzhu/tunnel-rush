# 限速八十 · 隧道狂飙

纯静态小游戏，浏览器直接打开 `index.html` 即可运行，无外部依赖、无构建步骤。

## 文件结构

- `css/game.css`（7.9 KB）
- `index.html`（3.5 KB）
- `js/audio.js`（3.4 KB）
- `js/config.js`（1.3 KB）
- `js/entities.js`（3.4 KB）
- `js/game.js`（5.8 KB）
- `js/hud.js`（2.9 KB）
- `js/input.js`（3.2 KB）
- `js/main.js`（2.3 KB）
- `js/render.js`（17.3 KB）
- `js/state.js`（1.2 KB）
- `tests/sim.test.mjs`（2.3 KB）

## 本地运行

```bash
python3 -m http.server 8000
```

（用了 ES Module，需要通过 http 打开，不能直接 file://）

## 玩法

- ↑ / W 加速，↓ / S 刹车，← → 变道；手机左右滑变道、上滑加速、下滑刹车
- 常态限速 80 km/h，施工区限速 40 km/h，测速摄像头超速抓拍罚分
- 车况归零即收工，跑完 3000 m 判定安全贯通

本仓库由 OpenClaw 自动发布。
