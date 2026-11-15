// 全局参数：距离单位统一用「米」，速度用「米/秒」，渲染时再换算成像素。
export const CFG = {
  lanes: [-3.5, 0, 3.5],        // 三条车道中心线（米）
  roadHalfWidth: 5.25,          // 路面半宽（米）
  walkwayWidth: 1.6,            // 两侧检修道宽（米）
  viewDepth: 240,               // 障碍物最远生成距离（米）
  playerYRatio: 0.78,           // 玩家车纵向位置（屏幕高度比例）
  horizonRatio: 0.11,           // 远端消失线
  limitNormal: 22.2,            // 常态限速 80 km/h
  limitWork: 11.1,              // 施工区限速 40 km/h
  maxSpeed: 33,                 // 车辆极速 ≈119 km/h
  startSpeed: 14,
  targetRate: 14,               // 长按油门时目标车速上升速率（米/秒²）
  accel: 5.5,                   // 实际车速跟随目标车速的加速度
  brake: 14,
  finishMeters: 3000,           // 贯通里程
  startCondition: 100,          // 车况初始值
  violationPenalty: 50,         // 超速罚分
  hitGrace: 0.8,                // 碰撞后的无敌时间（秒）
  cameraSpacing: [520, 880],    // 测速摄像头间距（米）
  workSpacing: [900, 1500],     // 施工区间距（米）
  workZoneLength: 240,          // 施工区长度（米）
};
