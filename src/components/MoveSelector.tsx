import type { Move } from "../types";

interface MoveSelectorProps {
  moves: Move[];
  disabled?: boolean;
  onSelect: (move: Move) => void;
}

export function MoveSelector({ moves, disabled, onSelect }: MoveSelectorProps) {
  return (
    <div className="move-selector">
      {moves.map((move) => (
        <button
          key={move.id}
          type="button"
          className={`move-selector__move type-badge--${move.type}`}
          disabled={disabled}
          onClick={() => onSelect(move)}
        >
          <span className="move-selector__name">{move.name}</span>
          <span className="move-selector__meta">
            {move.power != null ? `PWR ${move.power}` : "STATUS"} · PP {move.pp}
          </span>
        </button>
      ))}
    </div>
  );
}
