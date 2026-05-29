import { useEffect, useRef, useState } from 'react';
import { BOOKS, TAG_COLORS } from '../../data/books';
import { BOOK_STAGE_DURATION } from '../../utils/decay';

const BOOK_DECAY_STAGES = ['fresh', 'cooling', 'fading', 'critical'];

// 静态模式下各衰减阶段进度条的初始显示比例（仅用于视觉呈现）
const STATIC_PROGRESS = { fresh: 0.15, cooling: 0.55, fading: 0.80, critical: 1.0 };

// 保留的 Toast：仅归档和销毁这两个用户主动操作
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

// ── 动态模式下的书本计时器 ──
function runBookTimer(el) {
  function tick() {
    if (!el.isConnected) return;
    const stage    = el.dataset.stage;
    if (stage === 'critical') return;
    // 如果已被暂停（静态模式），停止走动
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
  // 删除 Toast：书本阶段推进不再弹提示，视觉变化本身已是反馈
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

// 为书本添加进度条并根据模式决定是否启动计时
function initBookDecay(el, i, isDemoMode) {
  const initDecay = el.dataset.initDecay || 'fresh';
  el.dataset.stage      = initDecay;
  el.dataset.stageStart = Date.now();
  el.dataset.stageMs    = BOOK_STAGE_DURATION[initDecay] + i * 1200 + Math.random() * 5000;
  el.dataset.paused     = isDemoMode ? 'false' : 'true';

  const prog = document.createElement('div');
  prog.className = 'book-decay-prog';
  prog.innerHTML = '<div class="bdp-fill"></div>';
  el.querySelector('.book-spine').appendChild(prog);

  const fill = prog.querySelector('.bdp-fill');

  if (initDecay === 'critical') {
    // critical 书本进度条始终显示满格红色
    fill.style.width = '100%';
    fill.style.background = 'rgba(255,80,80,0.7)';
    fill.style.animation = 'critFill 1.8s ease-in-out infinite';
    return;
  }

  if (isDemoMode) {
    // 动态模式：启动计时器
    runBookTimer(el);
  } else {
    // 静态模式：显示固定比例，不走动
    const staticPct = STATIC_PROGRESS[initDecay] || 0.15;
    fill.style.width = (staticPct * 100) + '%';
  }
}

export default function LayerShelf({ isDemoMode }) {
  const inited  = useRef(false);
  const [openBook, setOpenBook] = useState(null);

  // ── 初始化：只跑一次 ──
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
      el.dataset.initDecay = b.decay; // 记录初始衰减状态，供后续 isDemoMode 切换时用
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
          <div class="bc-tags">${b.tags.map(t => `<span class="bc-tag" style="border-color:${TAG_COLORS[b.tag]}50;color:${TAG_COLORS[b.tag]}">${t}</span>`).join('')}</div>
          <div class="bc-actions">
            <div class="bc-btn archive" data-archive="${i}">↑ 归档</div>
            <div class="bc-btn burn" data-burn="${i}">🔥 销毁</div>
          </div>
        </div>`;
      rows[b.row].appendChild(el);

      // 初始化进度条（静态模式）
      initBookDecay(el, i, false);

      // 点击书脊 → 打开书页
      el.querySelector('.book-spine').addEventListener('click', (e) => {
        e.stopPropagation();
        setOpenBook(BOOKS[i]);
      });

      // hover card
      let closeTimer = null;
      const openCard  = () => { clearTimeout(closeTimer); el.classList.add('card-open', 'lift-hover'); };
      const closeCard = () => { closeTimer = setTimeout(() => el.classList.remove('card-open', 'lift-hover'), 120); };
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
        showToast('📖 已归档至档案馆'); // 保留：用户主动操作需要确认
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
        showToast('🔥 记忆已销毁', 'var(--tag-rel)'); // 保留：破坏性操作需要确认
      });
    });
  }, []);

  // ── isDemoMode 变化：切换所有书本的计时器状态 ──
  useEffect(() => {
    const bookEls = Array.from(document.querySelectorAll('.book[data-init-decay]'));
    bookEls.forEach(el => {
      if (el.dataset.stage === 'critical') return; // critical 不受影响

      if (isDemoMode) {
        // 从静态切换到动态：记录切换时刻为新的 stageStart，开始计时
        el.dataset.paused     = 'false';
        el.dataset.stageStart = Date.now();
        runBookTimer(el);
      } else {
        // 从动态切换回静态：标记暂停，进度条停在当前位置（tick 内检查 paused 会自动停止）
        el.dataset.paused = 'true';
      }
    });
  }, [isDemoMode]);

  function triggerScene(type) {
    if (type === 'reset') {
      document.querySelectorAll('.book.triggered').forEach(b => {
        b.classList.remove('triggered');
        b.style.transform = '';
        b.style.opacity   = '';
      });
      document.querySelectorAll('.book').forEach(b => {
        b.style.opacity    = '';
        b.style.transition = '';
      });
      document.getElementById('shelf-overlay').classList.remove('on');
      return;
    }
    document.getElementById('shelf-overlay').classList.add('on');
    const tagMap = { cooking: ['life'], work: ['work', 'know'] };
    const tags   = tagMap[type] || [];
    document.querySelectorAll('.book').forEach(b => {
      const idx = parseInt(b.dataset.idx);
      if (idx >= 0 && idx < BOOKS.length) {
        if (tags.includes(BOOKS[idx].tag)) b.classList.add('triggered');
        else { b.style.opacity = '.2'; b.style.transition = 'opacity .5s'; }
      }
    });
    // 删除 Toast：书本弹出的视觉效果本身已是充分反馈
  }

  return (
    <>
      <div className="layer" id="layer-shelf">
        <div className="coral-glow" />
        <div className="layer-header">
          <div className="lh-zone">CORAL REEF · —1000m</div>
          <div className="lh-title">书架</div>
          <div className="lh-sub">中期记忆 · 点击书脊查阅 · 场景触发探出</div>
        </div>
        <div className="shelf-room">
          <div className="bookshelf" id="bookshelf" />
          <div className="shelf-overlay" id="shelf-overlay" />
          <div className="shelf-trigger">
            <div className="trigger-pill primary" onClick={() => triggerScene('cooking')}>🍳 想做饭了</div>
            <div className="trigger-pill secondary" onClick={() => triggerScene('work')}>💼 工作模式</div>
            <div className="trigger-pill reset" onClick={() => triggerScene('reset')}>重置</div>
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

  function deleteEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
    // 删除 Toast：条目已从列表消失，视觉反馈充分
  }
  function toggleImportant(id) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, important: !e.important } : e));
  }

  return (
    <div className="book-page-overlay" onClick={onClose}>
      <div className="book-page-panel" onClick={e => e.stopPropagation()}>

        <div className="bp-left" style={{ borderColor: tagColor + '30' }}>
          <div className="bp-cover-strip" style={{ background: book.color }} />
          <div className="bp-meta">
            <div className="bp-tag-dot" style={{ background: tagColor }} />
            <div className="bp-category" style={{ color: tagColor }}>
              {book.tags.join(' · ')}
            </div>
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
            <div className="bp-action-btn archive" onClick={() => {
              onClose();
              showToast('📚 已压入档案馆'); // 保留：用户主动操作
            }}>
              ↓ 压入档案馆
            </div>
            <div className="bp-action-btn burn" onClick={() => {
              onClose();
              showToast('🔥 书籍已销毁', 'var(--tag-rel)'); // 保留：破坏性操作
            }}>
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
            {entries.length === 0 && (
              <div className="bp-empty">这本书的记忆已全部删除</div>
            )}
            {entries.map(e => (
              <div key={e.id} className={`bp-entry ${e.decay} ${e.important ? 'important' : ''}`}>
                <div className="bp-entry-body">
                  <div className="bp-entry-text">{e.text}</div>
                  <div className="bp-entry-meta">
                    <span className="bp-entry-time">{e.time}</span>
                    <span className="bp-entry-decay" style={{ color: DECAY_COLOR[e.decay] }}>
                      {DECAY_LABEL[e.decay]}
                    </span>
                  </div>
                </div>
                <div className="bp-entry-actions">
                  <button
                    className={`bp-star ${e.important ? 'on' : ''}`}
                    onClick={() => toggleImportant(e.id)}
                    style={{ color: e.important ? '#ffd93d' : 'rgba(255,255,255,0.2)' }}
                  >★</button>
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
