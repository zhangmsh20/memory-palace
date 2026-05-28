const STOPS = [
  { label: 'SURFACE',    depth: '0m'      },
  { label: 'THERMOCLINE',depth: '—200m'   },
  { label: 'CORAL REEF', depth: '—1000m'  },
  { label: 'ABYSS',      depth: '—4000m'  },
];

export default function DepthGauge({ currentLayer, onNavigate }) {
  return (
    <div id="depth-gauge">
      {STOPS.map((s, i) => (
        <>
          {i > 0 && <div className="gauge-line" key={`line-${i}`} />}
          <div
            key={i}
            className={`gauge-stop${currentLayer === i ? ' active' : ''}`}
            onClick={() => onNavigate(i)}
          >
            <span className="gauge-label">{s.label} {s.depth}</span>
          </div>
        </>
      ))}
    </div>
  );
}
