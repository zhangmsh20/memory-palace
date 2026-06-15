/**
 * MemoryRefinement.jsx — 记忆提炼面板
 *
 * 触发方式：从 LayerShelf 的 BookPage 里点击「↓ 压入档案馆」时，
 *   不直接关闭，而是调用 onRefinementOpen(book) 打开此面板。
 *
 * Props:
 *   book         — BOOKS 中的单条书本对象
 *   onClose      — () => void  关闭面板（不归档）
 *   onConfirm    — (imprint) => void  确认归档，imprint 是用户编辑好的印记文本
 *
 * 设计原则：
 *   左列  经历细节  — 书架原始 entries，可勾选/取消
 *   中列  提炼层    — 视觉"过滤膜"，勾选条目用实线箭头穿过，取消勾选的淡出消散
 *   右列  印记预览  — 实时合成预览文字，用户可直接编辑
 *
 * 动效（确认后，由父组件控制书本消失）：
 *   1. 右列文字放大发光 300ms
 *   2. 左列条目右飘 + 消失 500ms
 *   3. 面板整体下沉 400ms
 *   → onConfirm(imprint) 在步骤 1 结束后立即调用
 */

import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────
   工具：把 entries 列表合成默认印记文本
   规则：取所有 important=true 的条目摘要，
         再补第一条普通条目，最后拼成一句话
───────────────────────────────────────── */
function synthesizeImprint(entries, bookTitle) {
  const important = entries.filter(e => e.important && e.checked !== false);
  const normal    = entries.filter(e => !e.important && e.checked !== false);
  const picks     = [...important, ...normal].slice(0, 3);
  if (picks.length === 0) return `关于「${bookTitle}」的核心记忆`;
  if (picks.length === 1) return picks[0].text;
  const last = picks.pop();
  return picks.map(e => e.text.split('：')[0] || e.text.slice(0, 12)).join('、') + `；${last.text.slice(0, 20)}`;
}

const DECAY_COLOR = {
  fresh:    'rgba(80,220,180,0.9)',
  cooling:  'rgba(255,200,80,0.8)',
  fading:   'rgba(180,150,90,0.7)',
  critical: 'rgba(255,80,80,0.8)',
};
const DECAY_LABEL = { fresh: '鲜活', cooling: '冷却中', fading: '褪色', critical: '临界' };

export default function MemoryRefinement({ book, onClose, onConfirm }) {
  /* entries 带 checked 状态 */
  const [entries, setEntries] = useState(
    () => (book.entries || []).map(e => ({ ...e, checked: true }))
  );
  const [imprint, setImprint] = useState(() =>
    synthesizeImprint(book.entries || [], book.title)
  );
  const [phase, setPhase] = useState('idle'); // idle | confirming | done
  const imprintRef = useRef(null);

  /* 重算印记 */
  useEffect(() => {
    setImprint(synthesizeImprint(entries, book.title));
  }, [entries]);

  /* 阻止背后的 ocean 滚动 */
  useEffect(() => {
    const ocean = document.getElementById('ocean');
    if (ocean) ocean.style.overflow = 'hidden';
    const stopWheel = e => e.stopPropagation();
    document.addEventListener('wheel', stopWheel, { capture: true });
    return () => {
      if (ocean) ocean.style.overflow = '';
      document.removeEventListener('wheel', stopWheel, { capture: true });
    };
  }, []);

  function toggle(id) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));
  }

  function handleConfirm() {
    if (phase !== 'idle') return;
    setPhase('confirming');
    /* 步骤1：右列放大发光 */
    setTimeout(() => {
      onConfirm(imprint);   /* 通知父组件归档 */
      setPhase('done');
    }, 320);
    /* 步骤3：面板下沉，结束后关闭 */
    setTimeout(() => {
      onClose();
    }, 1300);
  }

  const checked  = entries.filter(e => e.checked);
  const skipped  = entries.filter(e => !e.checked);

  return (
    <div className="mr-overlay" onClick={onClose}>
      <div
        className={`mr-panel ${phase === 'done' ? 'mr-panel--sinking' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── 顶部标题 ── */}
        <div className="mr-header">
          <div className="mr-title">这段记忆值得永远记住吗？</div>
          <div className="mr-subtitle">
            <span className="mr-book-chip" style={{ background: book.color }}>
              {book.title}
            </span>
            <span className="mr-arrow-hint">→ 沉入档案馆</span>
          </div>
          <button className="mr-close" onClick={onClose}>✕</button>
        </div>

        {/* ── 三列主体 ── */}
        <div className="mr-body">

          {/* 左列：经历细节 */}
          <div className="mr-col mr-col--left">
            <div className="mr-col-title">经历细节</div>
            <div className="mr-col-hint">取消勾选 = 允许遗忘</div>
            <div className="mr-entries">
              {entries.map(e => (
                <label
                  key={e.id}
                  className={`mr-entry ${e.checked ? 'mr-entry--on' : 'mr-entry--off'}`}
                  onClick={() => toggle(e.id)}
                >
                  <span className={`mr-checkbox ${e.checked ? 'mr-checkbox--on' : ''}`}>
                    {e.checked ? '✓' : '○'}
                  </span>
                  <span className="mr-entry-body">
                    <span className="mr-entry-text">{e.text}</span>
                    <span className="mr-entry-meta">
                      <span style={{ color: DECAY_COLOR[e.decay] }}>
                        {DECAY_LABEL[e.decay]}
                      </span>
                      {e.important && <span className="mr-star">★</span>}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 中列：提炼层 */}
          <div className="mr-col mr-col--filter">
            <div className="mr-filter-label">提炼</div>
            <div className="mr-filter-membrane">
              {/* 勾选条目的流向线 */}
              {checked.map((e, i) => (
                <div key={e.id} className="mr-flow-line mr-flow-line--pass"
                  style={{ top: `${20 + i * 28}%` }}>
                  <div className="mr-flow-arrow" />
                </div>
              ))}
              {/* 跳过条目的消散线 */}
              {skipped.map((e, i) => (
                <div key={e.id} className="mr-flow-line mr-flow-line--fade"
                  style={{ top: `${25 + (checked.length + i) * 24}%` }}>
                  <div className="mr-flow-arrow mr-flow-arrow--fade" />
                </div>
              ))}
              <div className="mr-filter-badge">
                <span>{checked.length}</span>
                <span className="mr-filter-badge-label">条保留</span>
              </div>
            </div>
            {skipped.length > 0 && (
              <div className="mr-filter-forget">
                {skipped.length} 条将随时间消散，<br />这是正常的。
              </div>
            )}
          </div>

          {/* 右列：印记预览 */}
          <div className="mr-col mr-col--right">
            <div className="mr-col-title">留下的印记</div>
            <div className="mr-col-hint">AI 帮你提炼，可以修改</div>
            <div
              className={`mr-imprint-wrap ${phase === 'confirming' ? 'mr-imprint-wrap--glow' : ''}`}
              ref={imprintRef}
            >
              <textarea
                className="mr-imprint-textarea"
                value={imprint}
                onChange={e => setImprint(e.target.value)}
                rows={5}
                maxLength={120}
              />
              <div className="mr-imprint-label">
                这条印记将在档案馆永久存在
              </div>
            </div>

            {/* 与档案馆已有节点的关联提示（静态示意） */}
            {book.tag && (
              <div className="mr-node-hint">
                <div className="mr-node-hint-dot"
                  style={{ background: `var(--tag-${book.tag})` }} />
                <span>将关联至档案馆 · <strong style={{ color: `var(--tag-${book.tag})` }}>
                  {tagLabel(book.tag)}
                </strong> 类节点</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 底部操作 ── */}
        <div className="mr-footer">
          <button className="mr-btn mr-btn--cancel" onClick={onClose}>
            先不了
          </button>
          <button
            className={`mr-btn mr-btn--confirm ${phase !== 'idle' ? 'mr-btn--confirming' : ''}`}
            onClick={handleConfirm}
            disabled={phase !== 'idle' || checked.length === 0}
          >
            {phase === 'idle' ? '沉入档案馆 ↓' : '正在沉入…'}
          </button>
        </div>
      </div>

      <style>{STYLES}</style>
    </div>
  );
}

function tagLabel(tag) {
  return { work: '工作', know: '知识', life: '生活', rel: '关系', id: '个人', emo: '情感' }[tag] || tag;
}

/* ─────────────────────────────────────────
   内联样式 — 遵循 variables.css 的 token 体系
   颜色全部使用 CSS 变量，不硬编码
───────────────────────────────────────── */
const STYLES = `
/* ── 遮罩 ── */
.mr-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(2,2,10,0.82);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  backdrop-filter: blur(4px);
}

/* ── 面板主体 ── */
.mr-panel {
  background: linear-gradient(160deg, var(--deep) 0%, var(--midnight) 100%);
  border: 1px solid rgba(110,70,255,0.25);
  border-radius: 16px;
  width: min(900px, 96vw);
  max-height: 90vh;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 0 60px rgba(110,70,255,0.12), 0 32px 64px rgba(0,0,0,0.6);
  transition: transform 0.4s cubic-bezier(.4,0,.2,1), opacity 0.4s ease;
}
.mr-panel--sinking {
  transform: translateY(40px);
  opacity: 0;
}

/* ── 顶部标题栏 ── */
.mr-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: relative;
}
.mr-title {
  font-family: var(--font-d);
  font-size: 17px;
  color: rgba(255,255,255,0.92);
  letter-spacing: 0.02em;
  margin-bottom: 6px;
}
.mr-subtitle {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(255,255,255,0.4);
}
.mr-book-chip {
  padding: 2px 8px; border-radius: 4px;
  font-size: 12px; color: rgba(255,255,255,0.7);
}
.mr-arrow-hint { color: rgba(110,70,255,0.7); }
.mr-close {
  position: absolute; top: 18px; right: 20px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.3); font-size: 16px;
  transition: color .2s;
}
.mr-close:hover { color: rgba(255,255,255,0.7); }

/* ── 三列主体 ── */
.mr-body {
  display: grid;
  grid-template-columns: 1fr 72px 1fr;
  gap: 0;
  flex: 1; overflow: hidden;
  min-height: 0;
}

/* ── 通用列样式 ── */
.mr-col {
  padding: 20px;
  display: flex; flex-direction: column; gap: 10px;
  overflow: hidden;
}
.mr-col--left  { border-right: 1px solid rgba(255,255,255,0.05); overflow-y: auto; }
.mr-col--right { border-left:  1px solid rgba(255,255,255,0.05); }
.mr-col-title {
  font-family: var(--font-m);
  font-size: 11px; letter-spacing: 0.12em;
  color: rgba(255,255,255,0.5); text-transform: uppercase;
}
.mr-col-hint {
  font-size: 11px; color: rgba(255,255,255,0.25);
  margin-top: -6px; margin-bottom: 4px;
}

/* ── 左列：经历条目 ── */
.mr-entries { display: flex; flex-direction: column; gap: 8px; }
.mr-entry {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 12px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: all .22s ease;
}
.mr-entry--on {
  background: rgba(255,255,255,0.04);
  border-color: rgba(110,70,255,0.2);
}
.mr-entry--off {
  background: transparent;
  opacity: 0.35;
  text-decoration: line-through;
  border-color: transparent;
}
.mr-checkbox {
  font-size: 13px; flex-shrink: 0; margin-top: 1px;
  color: rgba(255,255,255,0.3);
  transition: color .2s;
}
.mr-checkbox--on { color: var(--glow-fresh); }
.mr-entry-body { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.mr-entry-text { font-size: 13px; color: rgba(255,255,255,0.78); line-height: 1.4; }
.mr-entry-meta {
  display: flex; gap: 8px; align-items: center;
  font-size: 11px; color: rgba(255,255,255,0.3);
}
.mr-star { color: var(--tag-emo); font-size: 11px; }

/* ── 中列：提炼膜 ── */
.mr-col--filter {
  background: rgba(110,70,255,0.04);
  border-left:  1px solid rgba(110,70,255,0.12);
  border-right: 1px solid rgba(110,70,255,0.12);
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; padding: 20px 8px; gap: 12px;
  position: relative;
}
.mr-filter-label {
  font-family: var(--font-m);
  font-size: 10px; letter-spacing: 0.15em;
  color: rgba(110,70,255,0.6); text-transform: uppercase;
}
.mr-filter-membrane {
  flex: 1; width: 100%; position: relative;
  min-height: 120px;
}
.mr-filter-badge {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%);
  background: rgba(110,70,255,0.15);
  border: 1px solid rgba(110,70,255,0.3);
  border-radius: 20px; padding: 4px 10px;
  font-size: 13px; color: rgba(110,70,255,0.9);
  display: flex; flex-direction: column; align-items: center; gap: 0;
  white-space: nowrap;
}
.mr-filter-badge-label { font-size: 10px; color: rgba(110,70,255,0.5); }
.mr-filter-forget {
  font-size: 10px; color: rgba(255,255,255,0.2);
  text-align: center; line-height: 1.5;
}

/* 流向线 */
.mr-flow-line {
  position: absolute; left: 0; right: 0;
  height: 1px; display: flex; align-items: center;
}
.mr-flow-line--pass { background: linear-gradient(90deg, rgba(80,220,180,0.4), rgba(110,70,255,0.5)); }
.mr-flow-line--fade { background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent); }
.mr-flow-arrow {
  margin-left: auto;
  width: 0; height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid rgba(110,70,255,0.6);
}
.mr-flow-arrow--fade { border-left-color: rgba(255,255,255,0.12); }

/* ── 右列：印记 ── */
.mr-imprint-wrap {
  flex: 1; display: flex; flex-direction: column; gap: 8px;
  border-radius: 10px; padding: 14px;
  background: rgba(110,70,255,0.08);
  border: 1px solid rgba(110,70,255,0.2);
  transition: box-shadow .3s ease, border-color .3s ease;
}
.mr-imprint-wrap--glow {
  box-shadow: 0 0 24px rgba(110,70,255,0.45), 0 0 60px rgba(110,70,255,0.15);
  border-color: rgba(110,70,255,0.6);
  animation: mr-imprint-pulse 0.32s ease-out;
}
@keyframes mr-imprint-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.025); }
  100% { transform: scale(1); }
}
.mr-imprint-textarea {
  flex: 1; background: transparent; border: none;
  color: rgba(255,255,255,0.85); font-size: 14px;
  font-family: var(--font-b); line-height: 1.6;
  resize: none; outline: none;
  caret-color: var(--glow-a);
}
.mr-imprint-label {
  font-size: 11px; color: rgba(110,70,255,0.5);
  font-family: var(--font-m); letter-spacing: 0.08em;
}
.mr-node-hint {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: rgba(255,255,255,0.35);
  padding: 8px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
}
.mr-node-hint-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

/* ── 底部按钮 ── */
.mr-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; justify-content: flex-end; gap: 12px;
}
.mr-btn {
  padding: 9px 20px; border-radius: 8px; font-size: 13px;
  cursor: pointer; font-family: var(--font-b);
  transition: all .2s ease; border: 1px solid;
  letter-spacing: 0.02em;
}
.mr-btn--cancel {
  background: transparent;
  border-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.35);
}
.mr-btn--cancel:hover {
  border-color: rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.6);
}
.mr-btn--confirm {
  background: rgba(110,70,255,0.18);
  border-color: rgba(110,70,255,0.45);
  color: rgba(180,140,255,0.95);
}
.mr-btn--confirm:hover:not(:disabled) {
  background: rgba(110,70,255,0.3);
  box-shadow: 0 0 18px rgba(110,70,255,0.3);
}
.mr-btn--confirm:disabled {
  opacity: 0.35; cursor: not-allowed;
}
.mr-btn--confirming {
  animation: mr-confirm-shimmer 0.6s ease-out;
}
@keyframes mr-confirm-shimmer {
  0%   { box-shadow: 0 0 0 rgba(110,70,255,0); }
  50%  { box-shadow: 0 0 32px rgba(110,70,255,0.6); }
  100% { box-shadow: 0 0 8px rgba(110,70,255,0.2); }
}

/* ── 滚动条 ── */
.mr-col--left::-webkit-scrollbar { width: 4px; }
.mr-col--left::-webkit-scrollbar-track { background: transparent; }
.mr-col--left::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;
