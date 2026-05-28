export const STICKY_DATA = [
  // 今天
  { text: '黑客松 Demo v3 已完成，下午5点提交', tag: '工作', cls: 'c-blue',   decay: 'fresh',    xPct: 18, yBand: [62, 76], r: -2.5 },
  { text: '喜欢简洁直接的回答风格，不要废话',   tag: '偏好', cls: 'c-purple', decay: 'fresh',    xPct: 42, yBand: [65, 78], r:  2   },
  { text: '今天心情不错，完成了很多任务 😊',     tag: '情感', cls: 'c-yellow', decay: 'fresh',    xPct: 65, yBand: [60, 74], r:  2.5 },
  { text: '今天开会讨论了记忆宫殿核心方向',     tag: '工作', cls: 'c-blue',   decay: 'fresh',    xPct: 80, yBand: [64, 76], r:  3   },
  // 本周
  { text: '最近在学习知识图谱和向量数据库',     tag: '知识', cls: 'c-green',  decay: 'cooling',  xPct: 12, yBand: [40, 55], r:  1.5 },
  { text: '想做红烧肉，买五花肉、老抽、冰糖',   tag: '生活', cls: 'c-orange', decay: 'cooling',  xPct: 38, yBand: [42, 56], r: -1.5 },
  { text: '朋友王明下周来访，记得订餐厅',       tag: '关系', cls: 'c-red',    decay: 'cooling',  xPct: 62, yBand: [38, 52], r: -2   },
  // 更早
  { text: '验证码：847291',                     tag: '临时', cls: 'c-green',  decay: 'critical', xPct: 15, yBand: [14, 26], r: -1   },
  { text: '下午3点记得参加产品评审',             tag: '提醒', cls: 'c-orange', decay: 'fading',   xPct: 48, yBand: [16, 30], r: -2   },
];

export const TIME_BANDS = [
  { label: '今天', yFrom: 0.58, yTo: 0.82, color: 'rgba(80,220,180,0.03)'   },
  { label: '本周', yFrom: 0.34, yTo: 0.58, color: 'rgba(80,180,255,0.02)'   },
  { label: '更早', yFrom: 0.08, yTo: 0.34, color: 'rgba(200,180,100,0.015)' },
];

export const TAG_HEX_MAP = {
  'c-green':  '#43d9a0',
  'c-orange': '#ff9f43',
  'c-purple': '#9b6bff',
  'c-blue':   '#4a9eff',
  'c-red':    '#ff6b6b',
  'c-yellow': '#ffd93d',
};
