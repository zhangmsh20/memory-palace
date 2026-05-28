import { useEffect, useRef, useState } from 'react';
import { BOOKS, TAG_COLORS } from '../../data/books';
import { BOOK_STAGE_DURATION } from '../../utils/decay';

const BOOK_DECAY_STAGES = ['fresh', 'cooling', 'fading', 'critical'];

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
    const stage    = el.dataset.stage;
    if (stage === 'critical') return;
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
  const spine = el.querySelector('.book-spine');
  if (spine) spine.style.transition = 'filter 3s ease';
  if (next === 'cooling' || next === 'fading') {
    const d = document.createElement('div'); d.className = 'dust';
    d.style.cssText = `left:${45 + Math.random() * 20}%;top:0;--dur:${6 + Math.random() * 4}s;--del:0s;--dx:${-3 + Math.random() * 6}px`;
    el.appendChild(d);
  }
  showToast(`📖 《${el.querySelector('.book-title')?.textContent || '记忆'}》开始${next === 'cooling' ? '冷却' : '褪色'}`,
    next === 'cooling' ? 'rgba(255,200,80,0.8)' : 'rgba(150,120,80,0.8)');
  if (next !== 'critical') runBookTimer(el);
  else {
    const fill = el.querySelector('.bdp-fill');
    if (fill) { fill.style.width = '100%'; fill.style.background = 'rgba(255,80,80,0.7)'; fill.style.animation = 'critFill 1.8s ease-in-out infinite'; }
  }
}

function scheduleBookDecay(el, i) {
  el.dataset.stage      = 'fresh';
  el.dataset.stageStart = Date.now();
  el.dataset.stageMs    = BOOK_STAGE_DURATION.fresh + i * 1200 + Math.random() * 5000;
  const prog = document.createElement('div');
  prog.className = 'book-decay-prog';
  prog.innerHTML = '<div class="bdp-fill"></div>';
  el.querySelector('.book-spine').appendChild(prog);
  runBookTimer(el);
}

export default function LayerShelf() {
  const inited = useRef(false);
  const [openBook, setOpenBook] = useState(null); // BOOKS[i] or null

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
      el.dataset.idx = i;
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
      if (b.decay === 'fresh') scheduleBookDecay(el, i);

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

      // archive / burn buttons
      card.querySelector('[data-archive]').addEventListener('click', (e) => {
        e.stopPropagation();
        el.style.transition = 'all .8s cubic-bezier(.4,0,.2,1)';
        el.style.transform  = 'translateY(-24px) scale(0.7)'; el.style.opacity = '0';
        setTimeout(() => el.remove(), 800); showToast('📖 已归档至图书馆');
      });
      card.querySelector('[data-burn]').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        for (let k = 0; k < 14; k++) {
          const p = document.createElement('div'); p.className = 'fire-p';
          const sz = 3 + Math.random() * 9;
          p.style.cssText = `width:${sz}px;height:${sz}px;left:${rect.left + rect.width * .5}px;top:${rect.top + rect.height * .5}px;background:hsl(${15 + Math.random() * 35},92%,${48 + Math.random() * 22}%);--tx:${-35 + Math.random() * 70}px;--ty:${-70 + Math.random() * -35}px;animation-delay:${Math.random() * .25}s`;
          document.body.appendChild(p); setTimeout(() => p.remove(), 1100);
        }
        el.style.transition = 'all .5s ease'; el.style.opacity = '0'; el.style.transform = 'scale(0)';
        setTimeout(() => el.remove(), 500); showToast('🔥 记忆已销毁', 'var(--tag-rel)');
      });
    });
  }, []);

  function triggerScene(type) {
    if (type === 'reset') {
      document.querySelectorAll('.book.triggered').forEach(b => { b.classList.remove('triggered'); b.style.transform = ''; b.style.opacity = ''; });
      document.querySelectorAll('.book').forEach(b => { b.style.opacity = ''; b.style.transition = ''; });
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
    showToast(type === 'cooking' ? '🍳 食谱记忆已浮现' : '💼 工作记忆已激活');
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

      {/* 书页浮层 */}
      {openBook && <BookPage book={openBook} onClose={() => setOpenBook(null)} />}
    </>
  );
}

// ── 书页浮层组件 ──────────────────────────────────────
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
    showToast('🗑 记忆条目已删除', 'rgba(255,100,100,0.8)');
  }
  function toggleImportant(id) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, important: !e.important } : e));
  }

  return (
    <div className="book-page-overlay" onClick={onClose}>
      <div className="book-page-panel" onClick={e => e.stopPropagation()}>

        {/* 书页左侧：目录 & 元信息 */}
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
            <div className="bp-action-btn archive" onClick={() => { onClose(); showToast('📚 已压入图书馆'); }}>
              ↓ 压入图书馆
            </div>
            <div className="bp-action-btn burn" onClick={() => { onClose(); showToast('🔥 书籍已销毁', 'var(--tag-rel)'); }}>
              🔥 销毁
            </div>
          </div>
        </div>

        {/* 书页右侧：记忆条目 */}
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

        {/* 关闭 */}
        <div className="bp-close" onClick={onClose}>✕</div>
      </div>
    </div>
  );
}
