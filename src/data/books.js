/**
 * data/books.js — 书架层数据
 *
 * ★ v0.5 新增字段（配合 MemoryRefinement 两步式提炼面板使用）：
 *
 *   kind        — 中期记忆的"性质类型"，决定提炼时 AI 默认推荐的"去向"
 *                  'project'  项目/任务型 → 新建"事件"节点
 *                  'goal'     目标/计划型 → 新建"成就"节点
 *                  'relation' 关系型      → 合并入已有同名节点
 *                  'skill'    知识/技能型 → 合并入已有"能力"节点
 *                  'emotion'  情绪/复盘型 → 附加为"我"节点标签
 *                  'routine'  实用/生活型 → 附加为"我"节点标签（多数允许遗忘）
 *
 *   destination — 提炼面板第二步「定形态」的默认推荐去向：
 *                  { type: 'new_node', nodeType: 'event' | 'achievement' }
 *                  { type: 'merge',    target: '<已有档案馆节点名>' }
 *                  { type: 'tag' }
 *                  仅作为默认推荐，提炼面板中用户可以切换为另外两种去向。
 *
 * entries 结构不变；MemoryRefinement 内部按 `important` 字段
 * 做"关键条目 / 过程记录"的性质分组（无 important 条目时全部视为关键条目）。
 */
export const BOOKS = [
  // row 0
  {
    row: 0, title: '黑客松任务方向', tag: 'work', color: '#182240', h: 130, w: 32, decay: 'fresh',
    summary: '选择了任务3和任务2并行推进，核心产品理念已确定', tags: ['工作', '2026.05'],
    kind: 'project',
    destination: { type: 'new_node', nodeType: 'event' },
    entries: [
      { id: 'w1', text: '确定主题：打破黑盒——AI记忆可视化', time: '2天前', decay: 'fresh', important: true },
      { id: 'w2', text: '竞品分析：Notion AI、ChatGPT Memory 都缺少空间感', time: '2天前', decay: 'fresh' },
      { id: 'w3', text: '核心差异化：三层深度隐喻 + 衰减系统', time: '1天前', decay: 'fresh', important: true },
      { id: 'w4', text: '评审标准：可感知原型 + 设计判断说明', time: '1天前', decay: 'cooling' },
    ],
  },
  {
    row: 0, title: '记忆宫殿文档', tag: 'work', color: '#101e38', h: 130, w: 26, decay: 'fresh',
    summary: '三层记忆架构、衰减系统、场景触发完整规范', tags: ['工作', 'PRD'],
    kind: 'project',
    destination: { type: 'new_node', nodeType: 'event' },
    entries: [
      { id: 'p1', text: '架构：便利贴（短期）→ 书架（中期）→ 图书馆（长期）', time: '3天前', decay: 'fresh', important: true },
      { id: 'p2', text: '衰减四阶段：fresh / cooling / fading / critical', time: '2天前', decay: 'fresh' },
      { id: 'p3', text: '场景触发：用户意图激活对应记忆簇', time: '2天前', decay: 'cooling' },
      { id: 'p4', text: '书页查阅：点击书本展开完整记忆条目', time: '今天', decay: 'fresh', important: true },
    ],
  },
  {
    row: 0, title: '用户研究笔记', tag: 'work', color: '#1c2840', h: 130, w: 22, decay: 'cooling',
    summary: 'AI记忆透明度是核心用户痛点，控制感>功能数量', tags: ['工作', '研究'],
    kind: 'skill',
    destination: { type: 'merge', target: '产品方法论' },
    entries: [
      { id: 'u1', text: '用户最大恐惧：AI记住了什么但我不知道', time: '5天前', decay: 'cooling', important: true },
      { id: 'u2', text: '控制感比功能数量更重要——用户访谈结论', time: '4天前', decay: 'cooling' },
      { id: 'u3', text: '可视化优先于可编辑——先让人看见，再给人改', time: '4天前', decay: 'fading' },
    ],
  },
  {
    row: 0, title: '产品判断框架', tag: 'know', color: '#102818', h: 120, w: 28, decay: 'fresh',
    summary: 'Trade-off思维：每个不展示都是刻意的产品决策', tags: ['知识', '方法论'],
    kind: 'skill',
    destination: { type: 'merge', target: '产品方法论' },
    entries: [
      { id: 'k1', text: '每个隐藏都是决策，不展示 ≠ 不存在', time: '1周前', decay: 'fresh', important: true },
      { id: 'k2', text: '透明度三层：可见 → 可理解 → 可控制', time: '1周前', decay: 'fresh' },
      { id: 'k3', text: 'JTBD：用户雇佣AI记忆是为了减少认知负担', time: '6天前', decay: 'cooling' },
    ],
  },
  {
    row: 0, title: '知识图谱学习', tag: 'know', color: '#0c2418', h: 120, w: 22, decay: 'cooling',
    summary: 'Neo4j、向量数据库、temporal knowledge graph', tags: ['知识', '技术'],
    kind: 'skill',
    destination: { type: 'merge', target: '知识图谱' },
    entries: [
      { id: 'kg1', text: 'Neo4j：节点+关系的图数据库，适合记忆网络', time: '2周前', decay: 'cooling' },
      { id: 'kg2', text: '向量相似度搜索：余弦距离决定记忆检索优先级', time: '1周前', decay: 'fading' },
    ],
  },
  {
    row: 0, title: 'UI设计灵感', tag: 'know', color: '#181830', h: 120, w: 18, decay: 'fading',
    summary: '暗色深海风、景深层级、材质感动效', tags: ['设计', '灵感'],
    kind: 'skill',
    destination: { type: 'merge', target: '设计灵感库' },
    entries: [
      { id: 'd1', text: '深海色调参考：#02020a → #0d1035 的渐变层次', time: '2周前', decay: 'fading' },
      { id: 'd2', text: '发光系统：bio蓝 + abyssal紫 营造生物发光感', time: '2周前', decay: 'fading' },
    ],
  },
  // row 1
  {
    row: 1, title: '健身计划', tag: 'life', color: '#28180a', h: 132, w: 24, decay: 'fresh',
    summary: '力量训练，每周3次，避免膝盖负担', tags: ['生活', '健康'],
    kind: 'goal',
    destination: { type: 'new_node', nodeType: 'achievement' },
    entries: [
      { id: 'f1', text: '每周三次力量训练：周一胸背、周三腿、周五肩臂', time: '3天前', decay: 'fresh', important: true },
      { id: 'f2', text: '膝盖旧伤注意：避免深蹲超过90度，腿举替代', time: '1周前', decay: 'fresh', important: true },
      { id: 'f3', text: '蛋白质摄入目标：每天体重(kg)×1.6g', time: '4天前', decay: 'cooling' },
      { id: 'f4', text: '最佳训练时间：早上7-9点，精力最充沛', time: '5天前', decay: 'cooling' },
    ],
  },
  {
    row: 1, title: '常用食谱', tag: 'life', color: '#2c1608', h: 132, w: 30, decay: 'fresh',
    summary: '红烧肉、番茄炒蛋、清蒸鱼…拿手菜合集', tags: ['生活', '食谱'],
    kind: 'routine',
    destination: { type: 'tag' },
    entries: [
      { id: 'r1', text: '红烧肉：五花肉+老抽+冰糖，慢火收汁40分钟', time: '1周前', decay: 'fresh', important: true },
      { id: 'r2', text: '番茄炒蛋：先炒蛋出锅，番茄出汁后再合并', time: '3天前', decay: 'fresh' },
      { id: 'r3', text: '清蒸鱼：蒸8分钟，关火2分钟，浇热油', time: '2周前', decay: 'cooling' },
    ],
  },
  {
    row: 1, title: '王明相关', tag: 'rel', color: '#280808', h: 115, w: 20, decay: 'fading',
    summary: '下周来访，喜欢川菜，对设计感兴趣', tags: ['关系', '朋友'],
    kind: 'relation',
    destination: { type: 'merge', target: '王明' },
    entries: [
      { id: 'wm1', text: '下周五来上海，需要安排川菜馆', time: '3天前', decay: 'fresh', important: true },
      { id: 'wm2', text: '对交互设计很感兴趣，可以聊记忆宫殿项目', time: '1周前', decay: 'fading' },
      { id: 'wm3', text: '上次见面：3个月前，聊了很久AI产品趋势', time: '3个月前', decay: 'fading' },
    ],
  },
  {
    row: 1, title: '职业发展', tag: 'id', color: '#1c0a28', h: 135, w: 26, decay: 'fresh',
    summary: 'AI产品经理方向，关注LLM应用层创新', tags: ['个人', '职业'],
    kind: 'goal',
    destination: { type: 'new_node', nodeType: 'achievement' },
    entries: [
      { id: 'c1', text: '方向确认：AI产品经理，专注记忆与个性化方向', time: '2周前', decay: 'fresh', important: true },
      { id: 'c2', text: '下一步：参加黑客松积累产品作品集', time: '1周前', decay: 'fresh', important: true },
      { id: 'c3', text: '关注领域：LLM应用层、Agent记忆、个人AI助手', time: '1周前', decay: 'cooling' },
    ],
  },
  {
    row: 1, title: '情绪日记', tag: 'emo', color: '#282200', h: 110, w: 20, decay: 'fading',
    summary: '近期状态：专注且兴奋，对AI产品充满热情', tags: ['情感', '日记'],
    kind: 'emotion',
    destination: { type: 'tag' },
    entries: [
      { id: 'e1', text: '今天状态很好，完全进入心流，代码写到停不下来', time: '今天', decay: 'fresh' },
      { id: 'e2', text: '对记忆宫殿这个项目感到真正的兴奋，不只是deadline驱动', time: '2天前', decay: 'cooling', important: true },
      { id: 'e3', text: '有点焦虑时间不够，但焦虑中有期待', time: '3天前', decay: 'fading' },
    ],
  },
  {
    row: 1, title: '旧项目回顾', tag: 'work', color: '#181c28', h: 130, w: 16, decay: 'critical',
    summary: '去年的产品项目，已归档待删除', tags: ['工作', '归档'],
    kind: 'project',
    destination: { type: 'new_node', nodeType: 'event' },
    entries: [
      { id: 'old1', text: '去年做的社交App，已停止维护', time: '8个月前', decay: 'critical' },
      { id: 'old2', text: '核心教训：功能堆叠不如一个核心体验', time: '6个月前', decay: 'critical' },
    ],
  },
];

export const TAG_COLORS = {
  work: 'var(--tag-work)',
  know: 'var(--tag-know)',
  life: 'var(--tag-life)',
  rel:  'var(--tag-rel)',
  id:   'var(--tag-id)',
  emo:  'var(--tag-emo)',
};

