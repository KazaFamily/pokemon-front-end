import { useEffect, useRef } from "react";

interface BattleLogProps {
  entries: string[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  return (
    <div className="battle-log">
      <div className="battle-log__title">Battle Log</div>
      <div className="battle-log__entries">
        {entries.map((message, i) => (
          <div key={i} className="battle-log__entry">
            {message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
