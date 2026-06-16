/**
 * MemoryRefinement.jsx — 记忆提炼面板（v0.5 两步式重构）
 *
 * 触发方式：从 LayerShelf 的 BookPage 里点击「✦ 提炼」，
 *   或 book-card 悬浮卡的「✦」按钮，调用 onRefinementOpen(book) 打开此面板。
 *
 * Props:
 *   book      — BOOKS 中的单条书本对象（含 kind / destination / entries）
 *   onClose   — () => void  关闭面板（不提炼）
 *   onConfirm — (imprint, destination) => void  确认提炼，由父层移除书本+显示 toast
 *
 * 两步式交互：
 *   第一步「挑重点」— 展示 AI 筛选出的"关键条目"（important:true），
 *                     用户勾选觉得值得记住的；全不选 → 进入"确认遗忘"分支
 *   第二步「定形态」— 基于第一步的选择，AI 合成可编辑"印记"文本，
 *                     用户确认去向（新建节点 / 合并入已有 / 附加为"我"标签）
 *
 * 确认动效（三步，确认后由父层控制书本消失）：
 *   1. 印记卡放大发光 300ms
 *   2. 条目向右飘散消失 500ms
 *   3. 面板整体下沉淡出 400ms → onConfirm(imprint, destination)
 */

import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────
   工具：把选中条目合成默认印记文本
───────────────────────────────────────── */
function synthesizeImprint(picked, bookTitle) {
  if (picked.length === 0) return '';
  if (picked.length === 1) return picked[0].text;
  const last = picked[picked.length - 1];
  const heads = picked.slice(0, -1)
    .map(e => e.text.split('：')[0] || e.text.slice(0, 14));
  return heads.join('、') + `；${last.text.slice(0, 22)}`;
}

/* 去向配置 */
const DESTINATION_OPTIONS = [
  { type: 'new_node',  nodeType: 'event',       label: '新建事件节点',  desc: '作为独立历史记录加入图谱', icon: '◎' },
  { type: 'new_node',  nodeType: 'achievement',  label: '新建成就节点',  desc: '标记为人生里程碑',          icon: '✦' },
  { type: 'merge',     label: '合并入已有节点',  desc: '丰富已有记忆而不新增节点',                          icon: '⊕' },
  { type: 'tag',       label: '附加为"我"标签', desc: '更新自我认知标签，不进入图谱',                       icon: '◈' },
];

function destKey(d) {
  if (!d) return '';
  if (d.type === 'new_node') return `new_node_${d.nodeType}`;
  return d.type;
}

/* 根据 book.kind 推荐默认去向 option */
function getDefaultDestOption(book) {
  const d = book.destination;
  if (!d) return DESTINATION_OPTIONS[0];
  if (d.type === 'new_node' && d.nodeType === 'achievement') return DESTINATION_OPTIONS[1];
  if (d.type === 'new_node') return DESTINATION_OPTIONS[0];
  if (d.type === 'merge')    return DESTINATION_OPTIONS[2];
  return DESTINATION_OPTIONS[3];
}

const DECAY_COLOR = {
  fresh:    'rgba(80,220,180,0.9)',
  cooling:  'rgba(255,200,80,0.8)',
  fading:   'rgba(180,150,90,0.7)',
  critical: 'rgba(255,80,80,0.8)',
};

export default function MemoryRefinement({ book, onClose, onConfirm }) {
  const allEntries  = book.entries || [];
  const keyEntries  = allEntries.filter(e => e.important);   /* 关键条目 */
  const restEntries = allEntries.filter(e => !e.important);  /* 过程记录（折叠） */

  /* step: 'pick' | 'shape' | 'forget' | 'done' */
  const [step, setStep]         = useState('pick');
  const [picked, setPicked]     = useState(
    /* 默认全选关键条目；若无 important 条目则全选 */
    () => new Set((keyEntries.length ? keyEntries : allEntries).map(e => e.id))
  );
  const [showRest, setShowRest] = useState(false);
  const [imprint, setImprint]   = useState('');
  const [destOpt, setDestOpt]   = useState(() => getDefaultDestOption(book));
  const [sinking, setSinking]   = useState(false);

  /* 阻止 ocean 滚动 */
  useEffect(() => {
    const ocean = document.getElementById('ocean');
    if (ocean) ocean.style.overflow = 'hidden';
    const stop = e => e.stopPropagation();
    document.addEventListener('wheel', stop, { capture: true });
    return () => {
      if (ocean) ocean.style.overflow = '';
      document.removeEventListener('wheel', stop, { capture: true });
    };
  }, []);

  /* 当勾选变化时如果已进入第二步，实时重算印记 */
  useEffect(() => {
    if (step === 'shape') {
      const pickedList = allEntries.filter(e => picked.has(e.id));
      setImprint(synthesizeImprint(pickedList, book.title));
    }
  }, [picked, step]);

  function toggle(id) {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* 第一步 → 下一步 */
  function handlePickNext() {
    if (picked.size === 0) {
      setStep('forget');
      return;
    }
    const pickedList = allEntries.filter(e => picked.has(e.id));
    setImprint(synthesizeImprint(pickedList, book.title));
    setStep('shape');
  }

  /* 确认遗忘（第一步全不选后） */
  function handleForgetConfirm() {
    setSinking(true);
    setTimeout(() => onConfirm('', null, true /* forgot */), 400);
  }

  /* 第二步确认提炼 */
  function handleShapeConfirm() {
    if (sinking) return;
    setSinking(true);
    setTimeout(() => {
      onConfirm(imprint, destOpt);
    }, 760);
  }

  /* ── 渲染辅助 ── */
  function renderEntry(e, showToggle = true) {
    const isOn = picked.has(e.id);
    return (
      <div
        key={e.id}
        className={`mr-entry ${isOn ? 'mr-entry--on' : 'mr-entry--off'} ${showToggle ? 'mr-entry--clickable' : ''}`}
        onClick={showToggle ? () => toggle(e.id) : undefined}
      >
        {showToggle && (
          <span className={`mr-check ${isOn ? 'mr-check--on' : ''}`}>
            {isOn ? '✓' : '○'}
          </span>
        )}
        <span className="mr-entry-body">
          <span className="mr-entry-text">{e.text}</span>
          <span className="mr-entry-meta">
            {e.important && <span className="mr-star">★ 关键</span>}
            <span style={{ color: DECAY_COLOR[e.decay] || 'rgba(255,255,255,0.3)' }}>
              {e.time}
            </span>
          </span>
        </span>
      </div>
    );
  }

  const pickedCount  = picked.size;
  const skippedCount = allEntries.length - pickedCount;
  const displayEntries = keyEntries.length ? keyEntries : allEntries;

  return (
    <div className="mr-overlay" onClick={onClose}>
      <div
        className={`mr-panel ${sinking ? 'mr-panel--sinking' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── 顶部 ── */}
        <div className="mr-header">
          <div className="mr-step-bar">
            <span className={`mr-step-dot ${step === 'pick' || step === 'forget' ? 'mr-step-dot--on' : 'mr-step-dot--done'}`}>
              {step === 'pick' || step === 'forget' ? '1' : '✓'}
            </span>
            <span className={`mr-step-line ${step === 'shape' ? 'mr-step-line--on' : ''}`} />
            <span className={`mr-step-dot ${step === 'shape' ? 'mr-step-dot--on' : step === 'done' ? 'mr-step-dot--done' : 'mr-step-dot--off'}`}>2</span>
          </div>
          <div className="mr-header-right">
            <span className="mr-book-chip" style={{ background: book.color }}>{book.title}</span>
            <button className="mr-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ══ 第一步：挑重点 ══ */}
        {(step === 'pick') && (
          <div className="mr-step-body">
            <div className="mr-step-title">这本书里，有什么值得长期记住的？</div>
            <div className="mr-step-hint">取消勾选 = 允许遗忘 · 全部取消 = 这段记忆就此消散</div>

            <div className="mr-entries">
              {/* 关键条目（默认展示） */}
              {displayEntries.map(e => renderEntry(e))}

              {/* 过程记录（折叠） */}
              {restEntries.length > 0 && (
                <>
                  <button className="mr-fold-btn" onClick={() => setShowRest(v => !v)}>
                    {showRest ? '▲' : '▼'} 过程记录（{restEntries.length} 条）
                  </button>
                  {showRest && restEntries.map(e => renderEntry(e))}
                </>
              )}
            </div>

            {/* 底部统计 */}
            <div className="mr-pick-footer">
              <span className="mr-pick-stat">
                {pickedCount > 0
                  ? <><strong>{pickedCount}</strong> 条将被提炼{skippedCount > 0 && <>，<span className="mr-faded">{skippedCount} 条允许消散</span></>}</>
                  : <span className="mr-warn">全部取消 → 这段记忆将完全遗忘</span>
                }
              </span>
              <div className="mr-pick-actions">
                <button className="mr-btn mr-btn--cancel" onClick={onClose}>先不了</button>
                <button className="mr-btn mr-btn--next" onClick={handlePickNext}>
                  {pickedCount === 0 ? '确认遗忘' : '下一步 →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ 确认遗忘分支 ══ */}
        {step === 'forget' && (
          <div className="mr-step-body mr-forget-body">
            <div className="mr-forget-icon">～</div>
            <div className="mr-step-title">这段记忆就此消散</div>
            <div className="mr-step-hint">
              你没有勾选任何内容。<br />
              确认后，「{book.title}」将从书架消失，不产生任何档案馆记录。
            </div>
            <div className="mr-forget-actions">
              <button className="mr-btn mr-btn--cancel" onClick={() => setStep('pick')}>← 返回，再想想</button>
              <button className="mr-btn mr-btn--forget" onClick={handleForgetConfirm}>确认，就让它消散吧</button>
            </div>
          </div>
        )}

        {/* ══ 第二步：定形态 ══ */}
        {step === 'shape' && (
          <div className="mr-step-body mr-shape-body">
            <div className="mr-step-title">记住成什么样子，放在哪？</div>
            <div className="mr-step-hint">AI 帮你提炼了一句印记，可以直接修改</div>

            {/* 印记编辑区 */}
            <div className={`mr-imprint-wrap ${sinking ? 'mr-imprint-wrap--glow' : ''}`}>
              <textarea
                className="mr-imprint-textarea"
                value={imprint}
                onChange={e => setImprint(e.target.value)}
                rows={3}
                maxLength={120}
                placeholder="用一句话描述这段记忆……"
              />
              <div className="mr-imprint-label">这条印记将沉入档案馆 · 最多 120 字</div>
            </div>

            {/* 去向选择 */}
            <div className="mr-dest-title">放在档案馆的哪里？</div>
            <div className="mr-dest-options">
              {DESTINATION_OPTIONS.map(opt => {
                const isOn = destKey(opt) === destKey(destOpt);
                const isRecommended = destKey(opt) === destKey(getDefaultDestOption(book));
                return (
                  <div
                    key={destKey(opt)}
                    className={`mr-dest-opt ${isOn ? 'mr-dest-opt--on' : ''}`}
                    onClick={() => setDestOpt(opt)}
                  >
                    <span className="mr-dest-icon">{opt.icon}</span>
                    <span className="mr-dest-body">
                      <span className="mr-dest-label">
                        {opt.label}
                        {isRecommended && <span className="mr-dest-rec">AI 推荐</span>}
                      </span>
                      <span className="mr-dest-desc">
                        {opt.type === 'merge' && book.destination?.target
                          ? `→ 合并入「${book.destination.target}」节点`
                          : opt.desc}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mr-shape-footer">
              <button className="mr-btn mr-btn--cancel" onClick={() => setStep('pick')}>← 返回</button>
              <button
                className="mr-btn mr-btn--confirm"
                onClick={handleShapeConfirm}
                disabled={!imprint.trim() || sinking}
              >
                {sinking ? '沉入中…' : '沉入档案馆 ↓'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{STYLES}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   内联样式
───────────────────────────────────────── */
const STYLES = `
.mr-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(2,2,10,0.85);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  backdrop-filter: blur(5px);
}

.mr-panel {
  background: linear-gradient(160deg, var(--deep) 0%, var(--midnight) 100%);
  border: 1px solid rgba(110,70,255,0.22);
  border-radius: 16px;
  width: min(560px, 96vw);
  max-height: 88vh;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 0 60px rgba(110,70,255,0.1), 0 32px 64px rgba(0,0,0,0.65);
  transition: transform 0.45s cubic-bezier(.4,0,.2,1), opacity 0.45s ease;
}
.mr-panel--sinking { transform: translateY(48px); opacity: 0; }

/* ── 顶部 ── */
.mr-header {
  padding: 16px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: space-between;
}
.mr-step-bar {
  display: flex; align-items: center; gap: 6px;
}
.mr-step-dot {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-family: var(--font-m);
  transition: all .3s ease;
}
.mr-step-dot--on   { background: rgba(110,70,255,0.3); border: 1px solid rgba(110,70,255,0.6); color: rgba(180,140,255,0.95); }
.mr-step-dot--done { background: rgba(80,220,180,0.2); border: 1px solid rgba(80,220,180,0.5); color: rgba(80,220,180,0.9); }
.mr-step-dot--off  { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.25); }
.mr-step-line {
  width: 28px; height: 1px;
  background: rgba(255,255,255,0.1);
  transition: background .3s ease;
}
.mr-step-line--on { background: rgba(110,70,255,0.5); }
.mr-header-right {
  display: flex; align-items: center; gap: 10px;
}
.mr-book-chip {
  padding: 2px 9px; border-radius: 4px;
  font-size: 11px; color: rgba(255,255,255,0.65);
  font-family: var(--font-b);
}
.mr-close {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.25); font-size: 15px;
  transition: color .2s;
}
.mr-close:hover { color: rgba(255,255,255,0.6); }

/* ── 步骤主体通用 ── */
.mr-step-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 22px 22px 0;
  display: flex; flex-direction: column; gap: 14px;
}
.mr-step-body::-webkit-scrollbar { width: 3px; }
.mr-step-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

.mr-step-title {
  font-family: var(--font-d);
  font-size: 16px; color: rgba(255,255,255,0.9);
  letter-spacing: 0.01em; line-height: 1.4;
}
.mr-step-hint {
  font-size: 12px; color: rgba(255,255,255,0.3);
  line-height: 1.6; margin-top: -6px;
}

/* ── 条目列表 ── */
.mr-entries { display: flex; flex-direction: column; gap: 7px; }
.mr-entry {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 12px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: all .2s ease;
}
.mr-entry--clickable { cursor: pointer; }
.mr-entry--on  { background: rgba(255,255,255,0.04); border-color: rgba(110,70,255,0.18); }
.mr-entry--off { opacity: 0.3; }
.mr-entry--clickable.mr-entry--on:hover  { background: rgba(110,70,255,0.08); border-color: rgba(110,70,255,0.3); }
.mr-entry--clickable.mr-entry--off:hover { opacity: 0.5; }
.mr-check {
  font-size: 13px; flex-shrink: 0; margin-top: 1px;
  color: rgba(255,255,255,0.25); transition: color .2s;
}
.mr-check--on { color: var(--glow-fresh, rgba(80,220,180,0.9)); }
.mr-entry-body { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.mr-entry-text { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.45; }
.mr-entry-meta {
  display: flex; gap: 8px; align-items: center;
  font-size: 11px; color: rgba(255,255,255,0.28);
}
.mr-star { color: rgba(255,217,61,0.8); font-size: 10px; }

.mr-fold-btn {
  background: none; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px; padding: 5px 12px;
  color: rgba(255,255,255,0.28); font-size: 11px;
  cursor: pointer; text-align: left;
  transition: all .2s;
}
.mr-fold-btn:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); }

/* ── 第一步底部 ── */
.mr-pick-footer {
  position: sticky; bottom: 0;
  background: linear-gradient(to top, var(--midnight) 70%, transparent);
  padding: 18px 0 22px;
  display: flex; flex-direction: column; gap: 12px;
}
.mr-pick-stat {
  font-size: 12px; color: rgba(255,255,255,0.35);
}
.mr-pick-stat strong { color: rgba(80,220,180,0.85); }
.mr-faded { color: rgba(255,255,255,0.22); }
.mr-warn  { color: rgba(255,140,80,0.7); }
.mr-pick-actions { display: flex; justify-content: flex-end; gap: 10px; }

/* ── 确认遗忘分支 ── */
.mr-forget-body {
  align-items: center; justify-content: center;
  text-align: center; padding: 40px 32px 32px;
  gap: 16px;
}
.mr-forget-icon {
  font-size: 40px; color: rgba(255,255,255,0.12);
  font-family: var(--font-d);
}
.mr-forget-actions { display: flex; gap: 12px; margin-top: 8px; }

/* ── 第二步 ── */
.mr-shape-body { padding-bottom: 0; }
.mr-imprint-wrap {
  border-radius: 10px; padding: 14px 16px;
  background: rgba(110,70,255,0.08);
  border: 1px solid rgba(110,70,255,0.2);
  display: flex; flex-direction: column; gap: 8px;
  transition: box-shadow .3s ease, border-color .3s ease;
}
.mr-imprint-wrap--glow {
  box-shadow: 0 0 28px rgba(110,70,255,0.4);
  border-color: rgba(110,70,255,0.55);
  animation: mr-pulse .32s ease-out;
}
@keyframes mr-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.015); }
  100% { transform: scale(1); }
}
.mr-imprint-textarea {
  background: transparent; border: none; outline: none;
  color: rgba(255,255,255,0.88); font-size: 14px;
  font-family: var(--font-b); line-height: 1.6;
  resize: none; caret-color: rgba(110,70,255,0.9);
  width: 100%;
}
.mr-imprint-label {
  font-size: 10px; color: rgba(110,70,255,0.4);
  font-family: var(--font-m); letter-spacing: 0.08em;
}

/* 去向选择 */
.mr-dest-title {
  font-size: 11px; color: rgba(255,255,255,0.35);
  font-family: var(--font-m); letter-spacing: 0.1em;
  text-transform: uppercase;
}
.mr-dest-options { display: flex; flex-direction: column; gap: 7px; }
.mr-dest-opt {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 13px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer; transition: all .2s ease;
}
.mr-dest-opt:hover { background: rgba(255,255,255,0.03); border-color: rgba(110,70,255,0.2); }
.mr-dest-opt--on {
  background: rgba(110,70,255,0.1); border-color: rgba(110,70,255,0.35);
}
.mr-dest-icon {
  font-size: 16px; color: rgba(110,70,255,0.6);
  flex-shrink: 0; margin-top: 1px;
  width: 20px; text-align: center;
}
.mr-dest-opt--on .mr-dest-icon { color: rgba(180,140,255,0.9); }
.mr-dest-body { display: flex; flex-direction: column; gap: 2px; }
.mr-dest-label {
  font-size: 13px; color: rgba(255,255,255,0.65);
  display: flex; align-items: center; gap: 7px;
}
.mr-dest-opt--on .mr-dest-label { color: rgba(255,255,255,0.9); }
.mr-dest-rec {
  font-size: 9px; padding: 1px 6px; border-radius: 3px;
  background: rgba(80,220,180,0.12); color: rgba(80,220,180,0.7);
  font-family: var(--font-m); letter-spacing: 0.05em;
}
.mr-dest-desc { font-size: 11px; color: rgba(255,255,255,0.25); line-height: 1.4; }

.mr-shape-footer {
  position: sticky; bottom: 0;
  background: linear-gradient(to top, var(--midnight) 65%, transparent);
  padding: 18px 0 22px;
  display: flex; justify-content: flex-end; gap: 10px;
}

/* ── 通用按钮 ── */
.mr-btn {
  padding: 8px 18px; border-radius: 8px; font-size: 13px;
  cursor: pointer; font-family: var(--font-b);
  transition: all .2s ease; border: 1px solid;
  letter-spacing: 0.02em;
}
.mr-btn--cancel {
  background: transparent;
  border-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.3);
}
.mr-btn--cancel:hover { border-color: rgba(255,255,255,0.22); color: rgba(255,255,255,0.55); }
.mr-btn--next {
  background: rgba(110,70,255,0.15);
  border-color: rgba(110,70,255,0.4);
  color: rgba(180,140,255,0.9);
}
.mr-btn--next:hover { background: rgba(110,70,255,0.26); box-shadow: 0 0 16px rgba(110,70,255,0.25); }
.mr-btn--confirm {
  background: rgba(110,70,255,0.18);
  border-color: rgba(110,70,255,0.45);
  color: rgba(180,140,255,0.95);
}
.mr-btn--confirm:hover:not(:disabled) { background: rgba(110,70,255,0.3); box-shadow: 0 0 18px rgba(110,70,255,0.3); }
.mr-btn--confirm:disabled { opacity: 0.35; cursor: not-allowed; }
.mr-btn--forget {
  background: rgba(255,100,80,0.1);
  border-color: rgba(255,100,80,0.25);
  color: rgba(255,160,140,0.8);
}
.mr-btn--forget:hover { background: rgba(255,100,80,0.2); }
`;
