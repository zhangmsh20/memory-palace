import { useEffect, useRef, useState } from 'react';
import { BOOKS, TAG_COLORS } from '../../data/books';
import { BOOK_STAGE_DURATION } from '../../utils/decay';

const BOOK_DECAY_STAGES = ['fresh', 'cooling', 'fading', 'critical'];
const STATIC_PROGRESS = { fresh: 0.15, cooling: 0.55, fading: 0.80, critical: 1.0 };

// ── 场景模式配置 ──
const SCENE_MODES = [
  { id: 'reset',    icon: '○',  label: '全部显示',   tags: null },
  { id: 'cooking',  icon: '🍳', label: '想做饭了',   tags: ['life'] },
  { id: 'work',     icon: '💼', label: '工作模式',   tags: ['work', 'know'] },
  { id: 'fitness',  icon: '🏃', label: '健身计划',   tags: ['life'],  bookFilter: ['健身计划', '用户研究笔记'] },
  { id: 'emotion',  icon: '😊', label: '情绪复盘',   tags: ['emo', 'id'] },
  { id: 'knowledge',icon: '📚', label: '知识整理',   tags: ['know'] },
];

function showToast(msg, col = 'rgba(80,220,180,0.9)') {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; t.style.color = col;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function makeDust(decay) {
  if (decay === 'fresh') return '';
  const n = { cooling: 1, fading: 3, critical: 5 }[decay] || 0;
  return Array.from({ length: n }, (_, i) =>
    `<div class="dust" style="left:${40 + i * 10}%;top:0;--dur:${6 + i * 2}s;--del:${i * 1.5}s;--dx:${-5 + i * 3}px"></div>`
  ).join('');
}

function runBookTimer(el) {
  function tick() {
    if (!el.isConnected) return;
    if (el.dataset.stage === 'critical') return;
    if (el.dataset.paused === 'true') return;
    const elapsed  = Date.now() - parseInt(el.dataset.stageStart);
    const duration = parseInt(el.dataset.stageMs);
    const pct      = Math.min(1, elapsed / duration);
    const fill     = el.querySelector('.bdp-fill');
    if (fill) fill.style.width = (pct * 100) + '%';
    if (pct >= 1) advanceBookStage(el);
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function advanceBookStage(el) {
  const cur  = el.dataset.stage;
  const next = { fresh: 'cooling', cooling: 'fading', fading: 'critical' }[cur];
  if (!next) return;
  BOOK_DECAY_STAGES.forEach(s => el.classList.remove(s));
  el.classList.add(next);
  el.dataset.stage      = next;
  el.dataset.stageStart = Date.now();
  el.dataset.stageMs    = BOOK_STAGE_DURATION[next] || (12000 + Math.random() * 6000);
  if (next === 'cooling' || next === 'fading') {
    const d = document.createElement('div'); d.className = 'dust';
    d.style.cssText = `left:${45 + Math.random() * 20}%;top:0;--dur:${6 + Math.random() * 4}s;--del:0s;--dx:${-3 + Math.random() * 6}px`;
    el.appendChild(d);
  }
  if (next !== 'critical') {
    if (el.dataset.paused !== 'true') runBookTimer(el);
  } else {
    const fill = el.querySelector('.bdp-fill');
    if (fill) {
      fill.style.width = '100%';
      fill.style.background = 'rgba(255,80,80,0.7)';
      fill.style.animation = 'critFill 1.8s ease-in-out infinite';
    }
  }
}

function initBookDecay(el, i, isDemoMode) {
  const initDecay = el.dataset.initDecay || 'fresh';
  el.dataset.stage      = initDecay;
  el.dataset.stageStart = Date.now();
  el.dataset.stageMs    = BOOK_STAGE_DURATION[initDecay] + i * 1200 + Math.random() * 5000;
  el.dataset.paused     = 'true';
  const prog = document.createElement('div');
  prog.className = 'book-decay-prog';
  prog.innerHTML = '<div class="bdp-fill"></div>';
  el.querySelector('.book-spine').appendChild(prog);
  const fill = prog.querySelector('.bdp-fill');
  if (initDecay === 'critical') {
    fill.style.width = '100%';
    fill.style.background = 'rgba(255,80,80,0.7)';
    fill.style.animation = 'critFill 1.8s ease-in-out infinite';
    return;
  }
  const staticPct = STATIC_PROGRESS[initDecay] || 0.15;
  fill.style.width = (staticPct * 100) + '%';
}

export default function LayerShelf({ isDemoMode }) {
  const inited  = useRef(false);
  const [openBook, setOpenBook] = useState(null);
  // ✦ 当前激活模式 state（用于按钮高亮）
  const [activeScene, setActiveScene] = useState('reset');

  // ── 初始化 ──
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    const shelf = document.getElementById('bookshelf');
    if (!shelf) return;

    const rows = [document.createElement('div'), document.createElement('div')];
    rows.forEach(r => { r.className = 'shelf-row'; shelf.appendChild(r); });

    BOOKS.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = `book ${b.decay}`;
      el.dataset.idx       = i;
      el.dataset.initDecay = b.decay;
      el.style.height = b.h + 'px';
      el.style.setProperty('--book-h', b.h + 'px');
      el.innerHTML = `
        <div class="book-spine" style="height:${b.h}px;width:${b.w}px;background:${b.color}">
          <div class="book-tag-dot" style="background:${TAG_COLORS[b.tag]}"></div>
          <div class="book-title">${b.title}</div>
        </div>
        <div class="book-cover" style="height:${b.h}px;background:${b.color}"></div>
        <div class="book-top" style="background:${b.color}"></div>
        ${makeDust(b.decay)}
        <div class="book-card">
          <div class="bc-title">${b.title}</div>
          <div class="bc-summary">${b.summary}</div>
          <div class="bc-actions">
            <div class="bc-btn archive" data-archive="${i}" title="归档至档案馆">↑</div>
            <div class="bc-btn burn"    data-burn="${i}"    title="销毁记忆">🔥</div>
            <div class="bc-btn open"    data-open="${i}"    title="打开查阅">⬜</div>
          </div>
        </div>`;
      rows[b.row].appendChild(el);
      initBookDecay(el, i, false);

      el.querySelector('.book-spine').addEventListener('click', (e) => {
        e.stopPropagation();
        setOpenBook(BOOKS[i]);
      });

      // ✦ 修复 hover 跳动 bug：
      // 核心原因：mouseenter/mouseleave 触发在书本子元素（book-cover, book-top）之间反复跳，
      // 导致 card-open 类被反复加减。解决方案：用 contains 检查 relatedTarget 是否在书本内部。
      let closeTimer = null;
      const openCard = () => {
        clearTimeout(closeTimer);
        el.classList.add('card-open', 'lift-hover');
      };
      const closeCard = (e) => {
        // 如果鼠标移向的目标仍在这个 book 元素内部，不触发关闭
        if (e && el.contains(e.relatedTarget)) return;
        closeTimer = setTimeout(() => el.classList.remove('card-open', 'lift-hover'), 120);
      };

      // ✦ 用 mouseleave 替代 mouseleave，并检查 relatedTarget
      el.addEventListener('mouseenter', openCard);
      el.addEventListener('mouseleave', closeCard);

      const card = el.querySelector('.book-card');
      card.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      card.addEventListener('mouseleave', closeCard);

      // 归档按钮
      card.querySelector('[data-archive]').addEventListener('click', (e) => {
        e.stopPropagation();
        el.style.transition = 'all .8s cubic-bezier(.4,0,.2,1)';
        el.style.transform  = 'translateY(-24px) scale(0.7)';
        el.style.opacity    = '0';
        setTimeout(() => el.remove(), 800);
        showToast('📖 已归档至档案馆');
      });

      // 销毁按钮
      card.querySelector('[data-burn]').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        for (let k = 0; k < 14; k++) {
          const p = document.createElement('div'); p.className = 'fire-p';
          const sz = 3 + Math.random() * 9;
          p.style.cssText = `width:${sz}px;height:${sz}px;left:${rect.left + rect.width * .5}px;top:${rect.top + rect.height * .5}px;background:hsl(${15 + Math.random() * 35},92%,${48 + Math.random() * 22}%);--tx:${-35 + Math.random() * 70}px;--ty:${-70 + Math.random() * -35}px;animation-delay:${Math.random() * .25}s`;
          document.body.appendChild(p); setTimeout(() => p.remove(), 1100);
        }
        el.style.transition = 'all .5s ease';
        el.style.opacity    = '0';
        el.style.transform  = 'scale(0)';
        setTimeout(() => el.remove(), 500);
        showToast('🔥 记忆已销毁', 'var(--tag-rel)');
      });

      card.querySelector('[data-open]').addEventListener('click', (e) => {
        e.stopPropagation();
        setOpenBook(BOOKS[i]);
      });
    });
  }, []);

  // ── isDemoMode 切换 ──
  useEffect(() => {
    const bookEls = Array.from(document.querySelectorAll('.book[data-init-decay]'));
    bookEls.forEach(el => {
      if (el.dataset.stage === 'critical') return;
      if (isDemoMode) {
        el.dataset.paused     = 'false';
        el.dataset.stageStart = Date.now();
        runBookTimer(el);
      } else {
        el.dataset.paused = 'true';
      }
    });
  }, [isDemoMode]);

  // ✦ 重构场景切换：每次先完整清理内联样式，再下一帧应用新状态，彻底修复切换 bug
  function applyScene(sceneId) {
    setActiveScene(sceneId);

    // 第一步：同步清除所有遗留内联样式和 class
    document.querySelectorAll('.book').forEach(b => {
      b.classList.remove('triggered');
      b.style.removeProperty('opacity');
      b.style.removeProperty('transition');
      b.style.removeProperty('filter');
    });
    document.getElementById('shelf-overlay')?.classList.remove('on');

    if (sceneId === 'reset') return;

    const mode = SCENE_MODES.find(m => m.id === sceneId);
    if (!mode || !mode.tags) return;

    // 第二步：RAF 确保 DOM 清理已渲染，再应用新状态
    requestAnimationFrame(() => {
      document.getElementById('shelf-overlay')?.classList.add('on');
      document.querySelectorAll('.book').forEach(b => {
        const idx = parseInt(b.dataset.idx);
        if (idx < 0 || idx >= BOOKS.length) return;
        const book = BOOKS[idx];
        const tagMatch = mode.tags.includes(book.tag);
        // 如果有 bookFilter，额外按书名过滤
        const titleMatch = mode.bookFilter
          ? mode.bookFilter.some(t => book.title.includes(t))
          : tagMatch;
        const isActive = mode.bookFilter ? (tagMatch && titleMatch) || titleMatch : tagMatch;

        if (isActive) {
          b.classList.add('triggered');
        } else {
          b.style.opacity = '0.12';
          b.style.transition = 'opacity .4s ease';
          b.style.filter = 'saturate(0.2)';
        }
      });
    });
  }

  return (
    <>
      <div className="layer" id="layer-shelf">
        <div className="coral-glow" />
        <div className="layer-header">
          <div className="lh-zone">CORAL REEF · —1000m</div>
          <div className="lh-title">书架</div>
          <div className="lh-sub">中期记忆 · 点击书脊查阅 · 场景模式聚焦</div>
        </div>
        <div className="shelf-room">
          <div className="bookshelf" id="bookshelf" />
          <div className="shelf-overlay" id="shelf-overlay" />

          {/* ✦ 重构：统一的查看模式选择器 */}
          <div className="shelf-scene-bar">
            <span className="scene-bar-label">查看模式</span>
            <div className="scene-pills">
              {SCENE_MODES.map(m => (
                <div
                  key={m.id}
                  className={`scene-pill ${activeScene === m.id ? 'active' : ''}`}
                  onClick={() => applyScene(m.id)}
                >
                  <span className="sp-icon">{m.icon}</span>
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {openBook && <BookPage book={openBook} onClose={() => setOpenBook(null)} />}
    </>
  );
}

// ── 书页浮层 ──
const DECAY_LABEL = { fresh: '鲜活', cooling: '冷却中', fading: '褪色', critical: '临界' };
const DECAY_COLOR = {
  fresh:    'rgba(80,220,180,0.9)',
  cooling:  'rgba(255,200,80,0.8)',
  fading:   'rgba(180,150,90,0.7)',
  critical: 'rgba(255,80,80,0.8)',
};

function BookPage({ book, onClose }) {
  const [entries, setEntries] = useState(book.entries || []);
  const tagColor = TAG_COLORS[book.tag] || '#fff';

  useEffect(() => {
    const ocean = document.getElementById('ocean');
    if (ocean) ocean.style.overflow = 'hidden';
    const blockWheel = e => e.stopPropagation();
    document.addEventListener('wheel', blockWheel, { capture: true });
    return () => {
      if (ocean) ocean.style.overflow = '';
      document.removeEventListener('wheel', blockWheel, { capture: true });
    };
  }, []);

  function deleteEntry(id) { setEntries(prev => prev.filter(e => e.id !== id)); }
  function toggleImportant(id) { setEntries(prev => prev.map(e => e.id === id ? { ...e, important: !e.important } : e)); }

  return (
    <div className="book-page-overlay" onClick={onClose}>
      <div className="book-page-panel" onClick={e => e.stopPropagation()}>
        <div className="bp-left" style={{ borderColor: tagColor + '30' }}>
          <div className="bp-cover-strip" style={{ background: book.color }} />
          <div className="bp-meta">
            <div className="bp-tag-dot" style={{ background: tagColor }} />
            <div className="bp-category" style={{ color: tagColor }}>{book.tags.join(' · ')}</div>
          </div>
          <div className="bp-title">{book.title}</div>
          <div className="bp-summary">{book.summary}</div>
          <div className="bp-stats">
            <div className="bp-stat">
              <span className="bp-stat-num">{entries.length}</span>
              <span className="bp-stat-label">条记忆</span>
            </div>
            <div className="bp-stat">
              <span className="bp-stat-num">{entries.filter(e => e.important).length}</span>
              <span className="bp-stat-label">标记重要</span>
            </div>
          </div>
          <div className="bp-decay-badge" style={{ color: DECAY_COLOR[book.decay], borderColor: DECAY_COLOR[book.decay] + '40' }}>
            <span className="bp-decay-dot" style={{ background: DECAY_COLOR[book.decay] }} />
            {DECAY_LABEL[book.decay]}
          </div>
          <div className="bp-actions">
            <div className="bp-action-btn archive" onClick={() => { onClose(); showToast('📚 已压入档案馆'); }}>
              ↓ 压入档案馆
            </div>
            <div className="bp-action-btn burn" onClick={() => { onClose(); showToast('🔥 书籍已销毁', 'var(--tag-rel)'); }}>
              🔥 销毁
            </div>
          </div>
        </div>
        <div className="bp-right">
          <div className="bp-right-header">
            <div className="bp-right-title">记忆条目</div>
            <div className="bp-right-hint">点击 ★ 标记重要 · 点击 × 删除</div>
          </div>
          <div className="bp-entries">
            {entries.length === 0 && <div className="bp-empty">这本书的记忆已全部删除</div>}
            {entries.map(e => (
              <div key={e.id} className={`bp-entry ${e.decay} ${e.important ? 'important' : ''}`}>
                <div className="bp-entry-body">
                  <div className="bp-entry-text">{e.text}</div>
                  <div className="bp-entry-meta">
                    <span className="bp-entry-time">{e.time}</span>
                    <span className="bp-entry-decay" style={{ color: DECAY_COLOR[e.decay] }}>{DECAY_LABEL[e.decay]}</span>
                  </div>
                </div>
                <div className="bp-entry-actions">
                  <button className={`bp-star ${e.important ? 'on' : ''}`} onClick={() => toggleImportant(e.id)} style={{ color: e.important ? '#ffd93d' : 'rgba(255,255,255,0.2)' }}>★</button>
                  <button className="bp-del" onClick={() => deleteEntry(e.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bp-close" onClick={onClose}>✕</div>
      </div>
    </div>
  );
}
