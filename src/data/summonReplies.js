export const SUMMON_REPLIES = [
  {
    text:  '我在档案馆层找到了这段记忆。这是你的长期知识节点，已与 3 个相关概念形成连接。',
    layer: '档案馆·长期',
    color: 'var(--tag-id)',
    node:  '长期知识图谱',
  },
  {
    text:  '这段记忆在书架层，属于沉淀中的知识。距离上次访问 3 天，处于「冷却」状态。',
    layer: '书架层·中期',
    color: 'var(--tag-life)',
    node:  '中期记忆·冷却中',
  },
  {
    text:  '在便利贴层发现了相关的新鲜印象，这条记忆刚刚形成，还未完全沉淀。建议及时回顾以强化。',
    layer: '便利贴·短期',
    color: 'var(--tag-know)',
    node:  '短期记忆·鲜活',
  },
  {
    text:  '跨层检索完成——便利贴中有情绪记录，书架中有旧项目，图书馆节点也出现了微弱关联。',
    layer: '跨层检索',
    color: 'var(--tag-emo)',
    node:  '多层·综合提取',
  },
];

export const SG_NODES = [
  { label: '我',       type: 'id',   x: .50, y: .38, size: 13 },
  { label: '健身',     type: 'life', x: .22, y: .22, size:  9, meta: { badge: '冷却中', col: 'rgba(255,159,67,0.6)'  } },
  { label: '食谱',     type: 'life', x: .16, y: .55, size:  8 },
  { label: '时间偏好', type: 'emo',  x: .78, y: .24, size:  8, meta: { badge: '鲜活',   col: 'rgba(80,220,180,0.6)'  } },
  { label: '工作',     type: 'work', x: .76, y: .60, size:  9, meta: { badge: '近期',   col: 'rgba(74,158,255,0.6)'  } },
  { label: '王明',     type: 'rel',  x: .30, y: .78, size:  8, meta: { badge: '7天后',  col: 'rgba(255,107,107,0.6)' } },
  { label: '向量DB',   type: 'know', x: .60, y: .75, size:  8 },
  { label: '膝盖注意', type: 'life', x: .14, y: .38, size:  7, meta: { badge: '临界',   col: 'rgba(200,80,80,0.6)'   } },
];

export const SG_EDGES = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,7],[3,4]];

export const LAYER_ACCENTS = [
  'rgba(80,200,255,0.9)',
  'rgba(80,220,180,0.9)',
  'rgba(255,159,67,0.9)',
  'rgba(130,100,255,0.9)',
];
