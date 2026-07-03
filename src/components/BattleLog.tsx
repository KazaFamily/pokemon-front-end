import { useEffect, useRef } from "react";
import type { BattleLogEntry } from "../types";

interface BattleLogProps {
  entries: BattleLogEntry[];
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
        {entries.map((entry) => (
          <div key={entry.id} className="battle-log__entry">
            {entry.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
