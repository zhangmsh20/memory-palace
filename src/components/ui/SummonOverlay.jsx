import { useRef, useState } from 'react';
import { SUMMON_REPLIES, SG_NODES, SG_EDGES } from '../../data/summonReplies';
import { TAG_HEX } from '../../data/graphNodes';

function hexRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// ── Summon small graph ──────────────────────────────
let sgT = 0, sgActiveNodes = [0], sgActIdx = 1;
let _sgSearchPulse = false;
let sgCtx, sgW, sgH;
let sgCanvasInited = false;
let sgBeamInited   = false;

function initSummonGraph() {
  const canvas = document.getElementById('sg-canvas');
  if (!canvas) return;
  sgCtx = canvas.getContext('2d');
  function resize() { sgW = canvas.width = canvas.offsetWidth; sgH = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const timer = setInterval(() => {
    if (sgActIdx < SG_NODES.length) { sgActiveNodes.push(sgActIdx); sgActIdx++; }
    else clearInterval(timer);
  }, 800);
  drawSummonGraph();
}

function drawSummonGraph() {
  requestAnimationFrame(drawSummonGraph);
  if (!sgCtx || !sgW) return;
  sgT += 0.005;
  sgCtx.clearRect(0, 0, sgW, sgH);

  const nds = SG_NODES.map((n, i) => ({
    ...n,
    px: n.x * sgW + Math.cos(sgT * 0.7 + i * 1.2) * 2.2,
    py: n.y * sgH + Math.sin(sgT       + i * 0.9) * 2.2,
    active: sgActiveNodes.includes(i),
  }));

  SG_EDGES.forEach(([a, b]) => {
    if (!nds[a].active || !nds[b].active) return;
    const na = nds[a], nb = nds[b];
    sgCtx.beginPath(); sgCtx.moveTo(na.px, na.py); sgCtx.lineTo(nb.px, nb.py);
    sgCtx.strokeStyle = `rgba(255,255,255,${0.07 + 0.04 * Math.sin(sgT * 1.2 + a + b)})`;
    sgCtx.lineWidth = 1; sgCtx.stroke();
    const fp = (sgT * 0.35 + a * 0.28) % 1;
    sgCtx.beginPath();
    sgCtx.arc(na.px + (nb.px - na.px) * fp, na.py + (nb.py - na.py) * fp, 1.5, 0, Math.PI * 2);
    sgCtx.fillStyle = 'rgba(200,140,255,0.5)'; sgCtx.fill();
  });

  nds.forEach((n, i) => {
    if (!n.active) return;
    const col  = TAG_HEX[n.type] || '#fff';
    const [r, g, b] = hexRGB(col);
    const searchBoost = _sgSearchPulse && (i % 3 === 0 || i === 0) ? 1 + 0.35 * Math.abs(Math.sin(sgT * 7)) : 1;
    const pulse = 0.9 + 0.1 * Math.sin(sgT * 1.4 + i * 0.7);
    const rs    = n.size * pulse * searchBoost;

    const glow = sgCtx.createRadialGradient(n.px, n.py, 0, n.px, n.py, rs * 3);
    glow.addColorStop(0, `rgba(${r},${g},${b},${0.13 * searchBoost})`);
    glow.addColorStop(1, 'transparent');
    sgCtx.fillStyle = glow; sgCtx.beginPath(); sgCtx.arc(n.px, n.py, rs * 3, 0, Math.PI * 2); sgCtx.fill();

    const grad = sgCtx.createRadialGradient(n.px - rs * 0.3, n.py - rs * 0.3, 0, n.px, n.py, rs);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0.5)`);
    sgCtx.beginPath(); sgCtx.arc(n.px, n.py, rs, 0, Math.PI * 2);
    sgCtx.fillStyle = grad;
    sgCtx.shadowColor = col; sgCtx.shadowBlur = rs * 2.5; sgCtx.fill(); sgCtx.shadowBlur = 0;

    if (_sgSearchPulse && i === 0) {
      const ringR = rs + 5 * Math.abs(Math.sin(sgT * 5));
      sgCtx.beginPath(); sgCtx.arc(n.px, n.py, ringR, 0, Math.PI * 2);
      sgCtx.strokeStyle = `rgba(${r},${g},${b},0.35)`; sgCtx.lineWidth = 1; sgCtx.stroke();
    }

    sgCtx.fillStyle = 'rgba(255,255,255,0.7)';
    sgCtx.font = `${n.size > 10 ? 700 : 400} ${n.size * 0.68}px 'Syne'`;
    sgCtx.textAlign = 'center'; sgCtx.textBaseline = 'top'; sgCtx.shadowBlur = 0;
    sgCtx.fillText(n.label, n.px, n.py + rs + 3);
    if (n.meta) {
      sgCtx.font = `400 6px 'Syne Mono'`; sgCtx.fillStyle = n.meta.col;
      sgCtx.fillText(n.meta.badge, n.px, n.py + rs + n.size * 0.68 + 6);
    }
  });
}

// ── Beam canvas ──────────────────────────────────────
let sbCtx, sbW, sbH, sbInterval;

function initSummonBeam() {
  const c = document.getElementById('summon-beam-canvas');
  if (!c) return;
  sbCtx = c.getContext('2d');
  function resize() { sbW = c.width = c.offsetWidth; sbH = c.height = c.offsetHeight; }
  resize(); window.addEventListener('resize', resize);
  const beams = [
    { delay:  400, color: '#43d9a0' },
    { delay: 1500, color: '#9b6bff' },
    { delay: 2600, color: '#ffd93d' },
    { delay: 3900, color: '#4a9eff' },
  ];
  function fireAll() { beams.forEach(bd => setTimeout(() => drawBeam(bd), bd.delay)); }
  fireAll();
  sbInterval = setInterval(() => { sbCtx.clearRect(0, 0, sbW, sbH); fireAll(); }, 7000);
}

function drawBeam(bd) {
  if (!sbCtx || !sbW) return;
  const sx = sbW * (0.72 + Math.random() * 0.14);
  const sy = sbH * (0.25 + Math.random() * 0.5);
  const ex = sbW * 0.46, ey = sbH * 0.5;
  let prog = 0;
  const [r, g, b] = hexRGB(bd.color);
  function anim() {
    prog = Math.min(1, prog + 0.016);
    const cx = sx + (ex - sx) * prog, cy = sy + (ey - sy) * prog;
    sbCtx.save();
    const lg = sbCtx.createLinearGradient(sx, sy, cx, cy);
    lg.addColorStop(0, 'transparent'); lg.addColorStop(0.4, `rgba(${r},${g},${b},0.22)`); lg.addColorStop(1, `rgba(${r},${g},${b},0.82)`);
    sbCtx.beginPath(); sbCtx.moveTo(sx, sy); sbCtx.lineTo(cx, cy);
    sbCtx.strokeStyle = lg; sbCtx.lineWidth = 1.5;
    sbCtx.shadowColor = bd.color; sbCtx.shadowBlur = 14; sbCtx.stroke();
    sbCtx.beginPath(); sbCtx.arc(cx, cy, 3, 0, Math.PI * 2);
    sbCtx.fillStyle = bd.color; sbCtx.shadowBlur = 22; sbCtx.fill();
    sbCtx.restore();
    if (prog < 1) requestAnimationFrame(anim);
    else {
      beamArrival(ex, ey, r, g, b);
      setTimeout(() => sbCtx.clearRect(0, 0, sbW, sbH), 900);
    }
  }
  anim();
}

function beamArrival(x, y, r, g, b) {
  let radius = 3, alpha = 0.75;
  function ripple() {
    radius += 1.4; alpha -= 0.055;
    if (alpha <= 0) return;
    sbCtx.save(); sbCtx.beginPath(); sbCtx.arc(x, y, radius, 0, Math.PI * 2);
    sbCtx.strokeStyle = `rgba(${r},${g},${b},${alpha})`; sbCtx.lineWidth = 1.5; sbCtx.stroke(); sbCtx.restore();
    requestAnimationFrame(ripple);
  }
  ripple();
}

// ── Component ──────────────────────────────────────
let replyIdx = 0;

export default function SummonOverlay() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      bubble: '你好！我正在同时扫描你的三个记忆层级——<br>便利贴层的短期印象、书架层的沉淀知识，以及图书馆层的长期图谱。<br>你想召唤哪段记忆？',
      source: { dot: 'var(--tag-id)', text: '扫描来源：图书馆层 · 核心自我节点 · 连接数 8' },
    },
    { type: 'user', bubble: '帮我规划这周的健身计划' },
    {
      type: 'ai',
      bubble: '好的，我找到了你的相关记忆——<br>✦ <strong>力量训练偏好</strong>，每周3次<br>✦ <strong>膝盖注意</strong>，已自动规避深蹲<br>✦ <strong>早起习惯</strong>，建议安排在 7—9 点',
      sources: [
        { dotColor: 'var(--tag-life)', borderColor: 'rgba(255,159,67,0.2)', bg: 'rgba(255,159,67,0.05)', text: '书架层 · 健身计划 · 3天前更新' },
        { dotColor: 'var(--tag-id)',   borderColor: 'rgba(155,107,255,0.2)', bg: 'rgba(155,107,255,0.05)', text: '图书馆 · 身体状况节点 · 膝盖注意 → 力量训练' },
      ],
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const messagesRef = useRef(null);

  function openSummon() {
    if (open) return;
    setOpen(true);
    if (!sgCanvasInited) { sgCanvasInited = true; setTimeout(initSummonGraph, 50); }
    if (!sgBeamInited)   { sgBeamInited   = true; setTimeout(initSummonBeam,  50); }
    setTimeout(() => { const i = document.getElementById('sc-input'); if (i) i.focus(); }, 600);
  }

  function closeSummon() { setOpen(false); }

  function sendSummon() {
    const v = inputVal.trim();
    if (!v) return;
    const userMsg = { type: 'user', bubble: v };
    setMessages(prev => [...prev, userMsg, { type: 'thinking' }]);
    setInputVal('');
    _sgSearchPulse = true;
    setTimeout(() => { _sgSearchPulse = false; }, 1800);
    setTimeout(() => {
      const reply = SUMMON_REPLIES[replyIdx % SUMMON_REPLIES.length];
      replyIdx++;
      const aiMsg = {
        type: 'ai',
        bubble: reply.text,
        source: { dot: reply.color, text: `${reply.layer} · ${reply.node}`, borderColor: reply.color + '28', bg: 'transparent' },
      };
      setMessages(prev => prev.filter(m => m.type !== 'thinking').concat(aiMsg));
      setTimeout(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, 50);
    }, 1200);
  }

  return (
    <>
      {/* Summon button */}
      <div id="summon-btn" onClick={openSummon}>
        <div className="summon-pulse" />
        记忆召唤
      </div>

      {/* Overlay */}
      <div id="summon-overlay" className={open ? 'open' : ''}>
        <div id="summon-bg" onClick={closeSummon} />
        <div id="summon-halo" />
        <canvas id="summon-beam-canvas" />

        <div id="summon-panel">
          <div id="summon-close" onClick={closeSummon}>✕</div>

          {/* Left: chat */}
          <div id="summon-chat">
            <div className="sc-header">
              <div className="sc-title">记忆召唤</div>
              <div className="sc-sub">AI 正从记忆宫殿中实时提取相关信息</div>
            </div>

            <div id="sc-messages" ref={messagesRef}>
              {messages.map((m, i) => {
                if (m.type === 'thinking') return (
                  <div key={i} className="sc-msg ai">
                    <div className="sc-thinking">
                      <div className="sc-think-dots"><span /><span /><span /></div>
                      正在检索记忆图谱…
                    </div>
                  </div>
                );
                return (
                  <div key={i} className={`sc-msg ${m.type}`}>
                    <div className="sc-bubble" dangerouslySetInnerHTML={{ __html: m.bubble }} />
                    {m.source && (
                      <div className="sc-source" style={{ borderColor: m.source.borderColor, background: m.source.bg }}>
                        <div className="sc-source-dot" style={{ background: m.source.dot }} />
                        {m.source.text}
                      </div>
                    )}
                    {m.sources?.map((s, j) => (
                      <div key={j} className="sc-source" style={{ borderColor: s.borderColor, background: s.bg }}>
                        <div className="sc-source-dot" style={{ background: s.dotColor }} />
                        {s.text}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="sc-layer-badges">
              <span className="sc-layer-badge sticky"><span className="sc-badge-dot" />便利贴·短期</span>
              <span className="sc-layer-badge shelf"><span className="sc-badge-dot" />书架·中期</span>
              <span className="sc-layer-badge lib"><span className="sc-badge-dot" />图书馆·长期</span>
            </div>

            <div className="sc-input-row">
              <input
                id="sc-input"
                placeholder="召唤一段记忆…"
                maxLength={120}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendSummon(); }}
              />
              <div id="sc-send" onClick={sendSummon}>召唤</div>
            </div>
          </div>

          {/* Right: mini graph */}
          <div id="summon-graph">
            <div className="sg-header">
              <div className="sg-title">实时记忆图谱</div>
              <div className="sg-status"><div className="sg-status-dot" />正在检索中</div>
            </div>
            <canvas id="sg-canvas" />
            <canvas id="sg-beam-canvas" />
          </div>
        </div>
      </div>
    </>
  );
}
