/**
 * NightConsolidation.jsx — 深夜整理系统
 *
 * 包含三个导出：
 *
 * 1. NightBanner          顶部琥珀色横幅（首屏 / 海平面层使用）
 *    Props: count, onReview
 *
 * 2. NightReviewOverlay   深夜整理回顾浮层（书架层触发）
 *    Props: records, onSalvage(bookId, entryId), onDone
 *
 * 3. useNightConsolidation  Hook，管理整个深夜整理的状态
 *    返回: { hasNightEvent, nightRecords, triggerNight, markDone, salvageEntry }
 *
 * 使用方式（LayerShelf 父层）：
 *   const night = useNightConsolidation();
 *   // 在首屏渲染 <NightBanner>
 *   // 书架层渲染 <NightReviewOverlay>
 *   // "模拟深夜"按钮调用 night.triggerNight()
 *
 * ─── 数据结构 ───────────────────────────────────────────
 * NightRecord {
 *   bookId:   string          — 对应 BOOKS 的 title（唯一标识）
 *   bookTitle:string
 *   bookColor:string
 *   bookTag:  string
 *   time:     string          — "昨夜 2:17 AM"
 *   results:  EntryResult[]
 * }
 * EntryResult {
 *   id:       string
 *   text:     string
 *   outcome:  'archived' | 'forgotten' | 'salvaged'
 *   note:     string          — "合并入档案馆 · 运动节点" / "已遗忘"
 *   salvaged: boolean         — 用户是否打捞回来
 * }
 * ────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import { BOOKS } from '../../data/books';

/* ─── 静态配置：哪些书会被深夜整理 ─── */
const CONSOLIDATION_TARGETS = [
  {
    bookTitle: '用户研究笔记',
    time: '昨夜 2:17 AM',
    results: [
      { id: 'u1', text: '用户最大恐惧：AI记住了什么但我不知道', outcome: 'archived', note: '合并入档案馆 · 个人/认知节点' },
      { id: 'u2', text: '控制感比功能数量更重要——用户访谈结论', outcome: 'archived', note: '合并入档案馆 · 产品判断节点' },
      { id: 'u3', text: '可视化优先于可编辑——先让人看见，再给人改', outcome: 'forgotten', note: '已遗忘（细节已消散）' },
    ],
  },
  {
    bookTitle: '知识图谱学习',
    time: '昨夜 3:44 AM',
    results: [
      { id: 'kg1', text: 'Neo4j：节点+关系的图数据库，适合记忆网络', outcome: 'archived', note: '合并入档案馆 · 知识/技术节点' },
      { id: 'kg2', text: '向量相似度搜索：余弦距离决定记忆检索优先级', outcome: 'forgotten', note: '已遗忘（重复次数不足）' },
    ],
  },
  {
    bookTitle: '情绪日记',
    time: '昨夜 4:01 AM',
    results: [
      { id: 'e2', text: '对记忆宫殿这个项目感到真正的兴奋，不只是deadline驱动', outcome: 'archived', note: '合并入档案馆 · 情感/状态节点' },
      { id: 'e3', text: '有点焦虑时间不够，但焦虑中有期待', outcome: 'forgotten', note: '已遗忘（情绪记忆衰减）' },
    ],
  },
];

/* ─── Hook ─── */
export function useNightConsolidation() {
  const [hasNightEvent, setHasNightEvent] = useState(false);
  const [nightRecords, setNightRecords]   = useState([]);
  const [isDone, setIsDone]               = useState(false);

  /* 把静态配置和实际 BOOKS 数据关联起来 */
  const buildRecords = useCallback(() => {
    return CONSOLIDATION_TARGETS.map(t => {
      const book = BOOKS.find(b => b.title === t.bookTitle);
      return {
        bookId:    t.bookTitle,
        bookTitle: t.bookTitle,
        bookColor: book?.color || '#1a1a3a',
        bookTag:   book?.tag   || 'know',
        time:      t.time,
        results:   t.results.map(r => ({ ...r, salvaged: false })),
      };
    });
  }, []);

  const triggerNight = useCallback(() => {
    setNightRecords(buildRecords());
    setHasNightEvent(true);
    setIsDone(false);
  }, [buildRecords]);

  const markDone = useCallback(() => {
    setIsDone(true);
    /* 横幅不消失，只隐藏回顾浮层；banner 本身等用户点 × */
  }, []);

  const dismissBanner = useCallback(() => {
    setHasNightEvent(false);
    setNightRecords([]);
  }, []);

  /* 打捞一条被遗忘的 entry */
  const salvageEntry = useCallback((bookId, entryId) => {
    setNightRecords(prev => prev.map(rec => {
      if (rec.bookId !== bookId) return rec;
      return {
        ...rec,
        results: rec.results.map(r =>
          r.id === entryId ? { ...r, salvaged: true, outcome: 'salvaged' } : r
        ),
      };
    }));
  }, []);

  const archivedCount = nightRecords.reduce(
    (n, rec) => n + rec.results.filter(r => r.outcome === 'archived').length, 0
  );

  return { hasNightEvent, nightRecords, isDone, archivedCount, triggerNight, markDone, dismissBanner, salvageEntry };
}

/* ─── 常量 ─── */
const TAG_LABEL = { work:'工作', know:'知识', life:'生活', rel:'关系', id:'个人', emo:'情感' };
const TAG_VAR   = { work:'var(--tag-work)', know:'var(--tag-know)', life:'var(--tag-life)', rel:'var(--tag-rel)', id:'var(--tag-id)', emo:'var(--tag-emo)' };

/* ══════════════════════════════════════════════════════════
   NightBanner — 首屏琥珀色横幅
   ══════════════════════════════════════════════════════════ */
export function NightBanner({ count, onReview, onDismiss }) {
  return (
    <div className="nc-banner">
      <span className="nc-banner-moon">🌙</span>
      <span className="nc-banner-text">
        昨夜 AI 整理了你的 <strong>{count}</strong> 条记忆
      </span>
      <button className="nc-banner-review" onClick={onReview}>
        查看整理 →
      </button>
      <button className="nc-banner-dismiss" onClick={onDismiss} title="关闭">×</button>
      <style>{BANNER_STYLES}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   NightReviewOverlay — 深夜整理回顾浮层
   ══════════════════════════════════════════════════════════ */
export function NightReviewOverlay({ records, onSalvage, onDone }) {
  const [expandedBook, setExpandedBook] = useState(records[0]?.bookId ?? null);

  const archivedTotal  = records.reduce((n, r) => n + r.results.filter(e => e.outcome === 'archived').length,  0);
  const forgottenTotal = records.reduce((n, r) => n + r.results.filter(e => e.outcome === 'forgotten').length, 0);
  const salvagedTotal  = records.reduce((n, r) => n + r.results.filter(e => e.salvaged).length,                0);

  return (
    <div className="nc-overlay">
      <div className="nc-panel" onClick={e => e.stopPropagation()}>

        {/* ── 标题区 ── */}
        <div className="nc-header">
          <div className="nc-header-icon">🌙</div>
          <div>
            <div className="nc-header-title">深夜整理</div>
            <div className="nc-header-sub">AI 在你不在时悄悄做了这些</div>
          </div>
          <div className="nc-header-stats">
            <div className="nc-stat nc-stat--archive">
              <span className="nc-stat-num">{archivedTotal}</span>
              <span className="nc-stat-label">条已归档</span>
            </div>
            <div className="nc-stat nc-stat--forget">
              <span className="nc-stat-num">{forgottenTotal}</span>
              <span className="nc-stat-label">条已遗忘</span>
            </div>
            {salvagedTotal > 0 && (
              <div className="nc-stat nc-stat--salvage">
                <span className="nc-stat-num">{salvagedTotal}</span>
                <span className="nc-stat-label">条被打捞</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 书本列表 ── */}
        <div className="nc-book-list">
          {records.map(rec => (
            <div key={rec.bookId} className="nc-book-item">

              {/* 书本标题行（可点击展开） */}
              <div
                className={`nc-book-header ${expandedBook === rec.bookId ? 'nc-book-header--open' : ''}`}
                onClick={() => setExpandedBook(expandedBook === rec.bookId ? null : rec.bookId)}
              >
                <div className="nc-book-color-bar" style={{ background: rec.bookColor }} />
                <div className="nc-book-info">
                  <span className="nc-book-title">{rec.bookTitle}</span>
                  <span className="nc-book-time">{rec.time} 整理</span>
                </div>
                <div className="nc-book-tag" style={{ color: TAG_VAR[rec.bookTag] }}>
                  {TAG_LABEL[rec.bookTag]}
                </div>
                <div className="nc-book-pills">
                  <span className="nc-pill nc-pill--archive">
                    {rec.results.filter(r => r.outcome === 'archived').length} 归档
                  </span>
                  <span className="nc-pill nc-pill--forget">
                    {rec.results.filter(r => r.outcome === 'forgotten').length} 遗忘
                  </span>
                </div>
                <div className="nc-book-chevron">{expandedBook === rec.bookId ? '▲' : '▼'}</div>
              </div>

              {/* 展开：条目明细 */}
              {expandedBook === rec.bookId && (
                <div className="nc-entry-list">
                  {/* 三列表头 */}
                  <div className="nc-entry-row nc-entry-row--head">
                    <span>原书架内容</span>
                    <span></span>
                    <span>处理结果</span>
                  </div>

                  {rec.results.map(entry => {
                    const isForgotten = entry.outcome === 'forgotten' && !entry.salvaged;
                    const isSalvaged  = entry.salvaged;
                    const isArchived  = entry.outcome === 'archived';

                    return (
                      <div
                        key={entry.id}
                        className={`nc-entry-row ${isForgotten ? 'nc-entry-row--forgotten' : ''} ${isSalvaged ? 'nc-entry-row--salvaged' : ''}`}
                      >
                        {/* 左：原文 */}
                        <span className="nc-entry-text">{entry.text}</span>

                        {/* 中：箭头 */}
                        <span className="nc-entry-arrow">
                          {isForgotten ? <span className="nc-arrow-fade">╌╌╌✗</span>
                            : isSalvaged ? <span className="nc-arrow-salvage">↩ 打捞</span>
                            : <span className="nc-arrow-pass">──────►</span>}
                        </span>

                        {/* 右：结果 + 可打捞按钮 */}
                        <span className="nc-entry-note">
                          {isForgotten ? (
                            <>
                              <span className="nc-note--forget">{entry.note}</span>
                              <button
                                className="nc-salvage-btn"
                                onClick={() => onSalvage(rec.bookId, entry.id)}
                              >
                                打捞回来
                              </button>
                            </>
                          ) : isSalvaged ? (
                            <span className="nc-note--salvage">✓ 已打捞，返回书架</span>
                          ) : (
                            <span className="nc-note--archive">{entry.note}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  <div className="nc-book-footer">
                    这本书已提炼完成，将在 7 天后从书架消散
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── 底部 ── */}
        <div className="nc-footer">
          <div className="nc-footer-hint">
            被遗忘的细节会随时间消散，这是正常的。你可以在 7 天内随时打捞。
          </div>
          <button className="nc-done-btn" onClick={onDone}>
            好的，我知道了 ✓
          </button>
        </div>
      </div>

      <style>{OVERLAY_STYLES}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   样式
   ══════════════════════════════════════════════════════════ */

const BANNER_STYLES = `
.nc-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 800;
  background: linear-gradient(90deg, rgba(20,14,4,0.97) 0%, rgba(30,20,5,0.97) 100%);
  border-bottom: 1px solid rgba(255,160,50,0.25);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 24px;
  animation: nc-banner-in 0.5s cubic-bezier(.4,0,.2,1) both;
  box-shadow: 0 2px 24px rgba(255,140,30,0.08);
}
@keyframes nc-banner-in {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
.nc-banner-moon {
  font-size: 16px;
  filter: drop-shadow(0 0 6px rgba(255,200,80,0.6));
}
.nc-banner-text {
  font-family: var(--font-b);
  font-size: 13px;
  color: rgba(255,200,80,0.85);
  flex: 1;
}
.nc-banner-text strong {
  color: rgba(255,220,100,1);
  font-weight: 600;
}
.nc-banner-review {
  background: rgba(255,160,50,0.15);
  border: 1px solid rgba(255,160,50,0.35);
  border-radius: 6px;
  color: rgba(255,200,80,0.9);
  font-size: 12px;
  font-family: var(--font-b);
  padding: 5px 14px;
  cursor: pointer;
  transition: all .2s ease;
  white-space: nowrap;
}
.nc-banner-review:hover {
  background: rgba(255,160,50,0.28);
  box-shadow: 0 0 12px rgba(255,160,50,0.25);
}
.nc-banner-dismiss {
  background: none;
  border: none;
  color: rgba(255,200,80,0.3);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color .2s;
}
.nc-banner-dismiss:hover { color: rgba(255,200,80,0.7); }
`;

const OVERLAY_STYLES = `
/* ── 遮罩 ── */
.nc-overlay {
  position: fixed;
  inset: 0;
  z-index: 850;
  background: rgba(2,2,10,0.80);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: nc-fade-in 0.3s ease both;
}
@keyframes nc-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── 面板 ── */
.nc-panel {
  background: linear-gradient(160deg, var(--deep) 0%, var(--midnight) 100%);
  border: 1px solid rgba(255,160,50,0.18);
  border-radius: 16px;
  width: min(780px, 96vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(255,140,30,0.08), 0 32px 64px rgba(0,0,0,0.6);
  animation: nc-panel-in 0.35s cubic-bezier(.4,0,.2,1) both;
}
@keyframes nc-panel-in {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ── 顶部标题 ── */
.nc-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.nc-header-icon {
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(255,200,80,0.5));
  flex-shrink: 0;
}
.nc-header-title {
  font-family: var(--font-d);
  font-size: 16px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.04em;
}
.nc-header-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  margin-top: 2px;
  font-family: var(--font-b);
}
.nc-header-stats {
  margin-left: auto;
  display: flex;
  gap: 16px;
  align-items: center;
}
.nc-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.nc-stat-num {
  font-family: var(--font-m);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}
.nc-stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  font-family: var(--font-b);
}
.nc-stat--archive .nc-stat-num { color: var(--glow-fresh); }
.nc-stat--forget  .nc-stat-num { color: rgba(255,255,255,0.25); }
.nc-stat--salvage .nc-stat-num { color: var(--glow-warm); }

/* ── 书本列表 ── */
.nc-book-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.nc-book-list::-webkit-scrollbar { width: 4px; }
.nc-book-list::-webkit-scrollbar-track { background: transparent; }
.nc-book-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

/* ── 书本标题行 ── */
.nc-book-item {
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  background: rgba(255,255,255,0.02);
}
.nc-book-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background .18s ease;
}
.nc-book-header:hover { background: rgba(255,255,255,0.03); }
.nc-book-header--open { background: rgba(255,160,50,0.04); border-bottom: 1px solid rgba(255,255,255,0.05); }
.nc-book-color-bar {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
  opacity: 0.8;
}
.nc-book-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.nc-book-title { font-size: 13px; color: rgba(255,255,255,0.82); font-family: var(--font-b); }
.nc-book-time  { font-size: 11px; color: rgba(255,255,255,0.28); font-family: var(--font-m); }
.nc-book-tag   { font-size: 11px; font-family: var(--font-m); letter-spacing: 0.06em; flex-shrink: 0; }
.nc-book-pills { display: flex; gap: 6px; flex-shrink: 0; }
.nc-pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: var(--font-m);
  white-space: nowrap;
}
.nc-pill--archive { background: rgba(80,220,180,0.12); color: rgba(80,220,180,0.7); border: 1px solid rgba(80,220,180,0.15); }
.nc-pill--forget  { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.06); }
.nc-book-chevron  { font-size: 10px; color: rgba(255,255,255,0.2); flex-shrink: 0; }

/* ── 条目列表 ── */
.nc-entry-list {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nc-entry-row {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-family: var(--font-b);
  transition: opacity .3s ease;
}
.nc-entry-row--head {
  color: rgba(255,255,255,0.28);
  font-size: 10px;
  font-family: var(--font-m);
  letter-spacing: 0.08em;
  padding: 4px 10px 6px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.nc-entry-row--forgotten {
  background: rgba(255,255,255,0.02);
}
.nc-entry-row--salvaged {
  background: rgba(255,180,50,0.05);
  border: 1px solid rgba(255,180,50,0.12);
}
.nc-entry-text {
  color: rgba(255,255,255,0.7);
  line-height: 1.4;
}
.nc-entry-row--forgotten .nc-entry-text {
  color: rgba(255,255,255,0.28);
  text-decoration: line-through;
  text-decoration-color: rgba(255,255,255,0.15);
}
.nc-entry-row--salvaged .nc-entry-text {
  color: rgba(255,200,80,0.7);
  text-decoration: none;
}
.nc-entry-arrow { text-align: center; font-family: var(--font-m); font-size: 11px; }
.nc-arrow-pass    { color: rgba(80,220,180,0.5); letter-spacing: -1px; }
.nc-arrow-fade    { color: rgba(255,255,255,0.15); }
.nc-arrow-salvage { color: rgba(255,200,80,0.7); }
.nc-entry-note { display: flex; flex-direction: column; gap: 5px; }
.nc-note--archive { color: rgba(80,220,180,0.65); font-size: 11px; }
.nc-note--forget  { color: rgba(255,255,255,0.22); font-size: 11px; font-style: italic; }
.nc-note--salvage { color: rgba(255,200,80,0.7); font-size: 11px; }
.nc-salvage-btn {
  background: rgba(255,160,50,0.1);
  border: 1px solid rgba(255,160,50,0.25);
  border-radius: 5px;
  color: rgba(255,180,60,0.8);
  font-size: 10px;
  font-family: var(--font-b);
  padding: 3px 9px;
  cursor: pointer;
  transition: all .2s ease;
  width: fit-content;
}
.nc-salvage-btn:hover {
  background: rgba(255,160,50,0.2);
  box-shadow: 0 0 10px rgba(255,160,50,0.2);
}
.nc-book-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.04);
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  font-family: var(--font-m);
  font-style: italic;
}

/* ── 底部 ── */
.nc-footer {
  padding: 14px 24px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
}
.nc-footer-hint {
  flex: 1;
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  font-family: var(--font-b);
  line-height: 1.5;
}
.nc-done-btn {
  background: rgba(255,160,50,0.14);
  border: 1px solid rgba(255,160,50,0.3);
  border-radius: 8px;
  color: rgba(255,200,80,0.9);
  font-size: 13px;
  font-family: var(--font-b);
  padding: 9px 20px;
  cursor: pointer;
  transition: all .2s ease;
  white-space: nowrap;
}
.nc-done-btn:hover {
  background: rgba(255,160,50,0.25);
  box-shadow: 0 0 16px rgba(255,160,50,0.2);
}
`;
