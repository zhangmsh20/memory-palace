export const NODES = [
  { id:  0, label: '我',        type: 'id',   desc: '核心自我节点',                  x: .50, y: .50, size: 22, connections: 8 },
  { id:  1, label: 'AI产品经理', type: 'work', desc: '当前职业方向',                  x: .73, y: .30, size: 17 },
  { id:  2, label: '黑客松2026', type: 'work', desc: '当前最重要的工作任务',           x: .62, y: .20, size: 15 },
  { id:  3, label: '记忆宫殿',   type: 'work', desc: '正在设计的核心产品',             x: .52, y: .16, size: 14 },
  { id:  4, label: '力量训练',   type: 'life', desc: '每周3次，避免膝盖负担',          x: .27, y: .33, size: 13 },
  { id:  5, label: '红烧肉食谱', type: 'life', desc: '拿手菜，五花肉+老抽+冰糖',      x: .18, y: .50, size: 11 },
  { id:  6, label: '简洁偏好',   type: 'id',   desc: '不喜欢废话，直接给结论',         x: .76, y: .54, size: 13 },
  { id:  7, label: '知识图谱',   type: 'know', desc: '技术兴趣，正在深入学习',         x: .42, y: .74, size: 14 },
  { id:  8, label: '王明',       type: 'rel',  desc: '朋友，设计爱好者，下周来访',     x: .21, y: .70, size: 12 },
  { id:  9, label: '早起习惯',   type: 'emo',  desc: '偏好7-9点工作与运动',           x: .80, y: .70, size: 11 },
  { id: 10, label: '向量数据库', type: 'know', desc: 'AI记忆底层技术研究',             x: .56, y: .82, size: 12 },
  { id: 11, label: 'UX设计趋势', type: 'know', desc: '2026年前沿设计方法',            x: .34, y: .26, size: 12 },
  { id: 12, label: '膝盖注意',   type: 'life', desc: '健身时避免深蹲类动作',           x: .14, y: .40, size: 10 },
  { id: 13, label: '川菜偏好',   type: 'life', desc: '外出就餐首选',                  x: .30, y: .80, size: 10 },
];

export const EDGES = [
  [0,1],[0,4],[0,6],[0,8],[0,9],[0,7],
  [1,2],[1,3],[1,11],
  [2,3],[3,7],[3,10],[7,10],
  [4,12],[4,9],[8,13],[5,13],[0,5],[0,2],
];

export const TAG_HEX = {
  id:   '#9b6bff',
  work: '#4a9eff',
  know: '#43d9a0',
  life: '#ff9f43',
  rel:  '#ff6b6b',
  emo:  '#ffd93d',
};

export const TAG_NAMES = {
  id:   '个人/身份',
  work: '工作/项目',
  know: '知识/学习',
  life: '生活/场景',
  rel:  '关系/人物',
  emo:  '情感/状态',
};
