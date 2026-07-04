import { api } from "../api";
import type { TcgCard } from "../types";

// Fetch-once, session-lifetime cache of the full TCG card catalog
// (~1,267 cards on the real backend) - needed by the deck builder (browse/
// search) and the battle page (resolving hand/legalActions cardIds to
// names for display). No React Context needed - this repo doesn't use one
// elsewhere, and a plain module-level cache is enough for a fetch-once value.
let cached: Promise<Map<number, TcgCard>> | null = null;

export function getTcgCatalog(): Promise<Map<number, TcgCard>> {
  if (!cached) {
    cached = api.listTcgCards().then(({ cards }) => new Map(cards.map((c) => [c.cardId, c])));
    cached.catch(() => {
      cached = null; // allow retrying after a failed fetch
    });
  }
  return cached;
}
