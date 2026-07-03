interface HPBarProps {
  current: number;
  max: number;
}

export function HPBar({ current, max }: HPBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const tier = pct > 50 ? "high" : pct > 20 ? "mid" : "low";

  return (
    <div className="hp-bar">
      <div className="hp-bar__label">
        <span>HP</span>
        <span className="hp-bar__value">
          {current} / {max}
        </span>
      </div>
      <div className="hp-bar__track">
        <div className={`hp-bar__fill hp-bar__fill--${tier}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
