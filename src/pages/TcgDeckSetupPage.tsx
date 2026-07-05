import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { TcgCard, TcgStarterDeck } from "../types";
import { TcgCardView } from "../components/TcgCardView";
import { getMyTrainerId } from "../lib/myTrainer";
import { getTcgCatalog } from "../lib/tcgCatalog";

const DECK_SIZE = 60;
const MAX_COPIES = 4;
const MAX_ACE_SPEC = 1;

export function TcgDeckSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opponentId = searchParams.get("opponent") ?? "";
  const trainerId = getMyTrainerId();

  const [catalog, setCatalog] = useState<Map<number, TcgCard>>(new Map());
  const [counts, setCounts] = useState<Map<number, number>>(new Map());
  const [starterDecks, setStarterDecks] = useState<TcgStarterDeck[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    Promise.all([getTcgCatalog(), api.getTrainer(trainerId), api.listTcgStarterDecks()])
      .then(([catalogMap, trainer, { starterDecks }]) => {
        setCatalog(catalogMap);
        setStarterDecks(starterDecks);
        // Pre-populate from the trainer's current tcgDeck, if any, so editing an
        // existing legal deck doesn't mean starting from scratch.
        const initialCounts = new Map<number, number>();
        for (const card of trainer.tcgDeck) initialCounts.set(card.cardId, (initialCounts.get(card.cardId) ?? 0) + 1);
        setCounts(initialCounts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load the card catalog"))
      .finally(() => setIsLoading(false));
  }, [trainerId]);

  function applyStarterDeck(deck: TcgStarterDeck) {
    const nextCounts = new Map<number, number>();
    for (const cardId of deck.cardIds) nextCounts.set(cardId, (nextCounts.get(cardId) ?? 0) + 1);
    setCounts(nextCounts);
  }

  const totalCards = useMemo(() => [...counts.values()].reduce((sum, n) => sum + n, 0), [counts]);

  const legalityWarnings = useMemo(() => {
    const warnings: string[] = [];
    let aceSpecCount = 0;
    let hasBasicPokemon = false;
    for (const [cardId, count] of counts) {
      const card = catalog.get(cardId);
      if (!card) continue;
      if (card.category !== "basic-energy" && count > MAX_COPIES) {
        warnings.push(`${card.name}: ${count} copies (max ${MAX_COPIES})`);
      }
      if (card.category === "pokemon" && card.ruleTag === "ace-spec") aceSpecCount += count;
      if (card.category === "pokemon" && card.stage === "basic") hasBasicPokemon = true;
    }
    if (aceSpecCount > MAX_ACE_SPEC) warnings.push(`${aceSpecCount} ACE SPEC cards (max ${MAX_ACE_SPEC})`);
    if (totalCards === DECK_SIZE && !hasBasicPokemon) warnings.push("No Basic Pokémon in the deck");
    return warnings;
  }, [counts, catalog, totalCards]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];
    return [...catalog.values()].filter((c) => c.name.toLowerCase().includes(query)).slice(0, 40);
  }, [search, catalog]);

  const deckEntries = useMemo(
    () => [...counts.entries()].flatMap(([cardId, count]) => (count > 0 && catalog.has(cardId) ? [[cardId, count] as const] : [])),
    [counts, catalog],
  );

  function addCard(cardId: number) {
    setCounts((prev) => new Map(prev).set(cardId, (prev.get(cardId) ?? 0) + 1));
  }

  function removeCard(cardId: number) {
    setCounts((prev) => {
      const next = new Map(prev);
      const current = next.get(cardId) ?? 0;
      if (current <= 1) next.delete(cardId);
      else next.set(cardId, current - 1);
      return next;
    });
  }

  async function handleConfirm() {
    if (!trainerId || totalCards !== DECK_SIZE) return;
    const cardIds = deckEntries.flatMap(([cardId, count]) => Array(count).fill(cardId));
    setIsSubmitting(true);
    setError(null);
    try {
      await api.setTcgDeck(trainerId, cardIds);
      if (opponentId) {
        const battle = await api.createTcgBattle(trainerId, opponentId);
        navigate(`/tcg/battle/${battle.battleId}`);
      } else {
        navigate("/tcg");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your deck");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!trainerId) {
    return (
      <div className="page">
        <h1>Build Your Deck</h1>
        <p>You need to log in first.</p>
        <button type="button" onClick={() => navigate("/")}>
          Go to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Build Your Deck</h1>
      <p className="muted">
        {opponentId ? (
          <>
            Build a real, legal {DECK_SIZE}-card deck from the full card catalog to battle trainer <code>{opponentId}</code>
            {" "}-{" "}
          </>
        ) : (
          <>Build a real, legal {DECK_SIZE}-card deck from the full card catalog - </>
        )}
        up to {MAX_COPIES} copies of any card (Basic Energy unlimited), at most {MAX_ACE_SPEC} ACE SPEC card, and at least
        one Basic Pokémon.
      </p>

      {isLoading ? (
        <p>Loading the card catalog…</p>
      ) : (
        <>
          {starterDecks.length > 0 && (
            <section className="panel">
              <h2>Starter Decks</h2>
              <p className="muted">
                Load a ready-to-play, legal {DECK_SIZE}-card deck as a starting point, then add or remove cards below -
                loading one replaces what's currently in Your Deck (not saved until you Confirm & Battle).
              </p>
              <ul>
                {starterDecks.map((deck) => (
                  <li key={deck.id} className="form-row">
                    <span>
                      <strong>{deck.name}</strong> - {deck.description}
                    </span>
                    <button type="button" onClick={() => applyStarterDeck(deck)}>
                      Load
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel">
            <h2>
              Your Deck ({totalCards}/{DECK_SIZE})
            </h2>
            {deckEntries.length === 0 ? (
              <p className="muted">Search below to add cards.</p>
            ) : (
              <div className="pokemon-grid">
                {deckEntries.map(([cardId, count]) => (
                  <TcgCardView key={cardId} card={catalog.get(cardId)!} count={count} onClick={() => removeCard(cardId)} />
                ))}
              </div>
            )}
            {legalityWarnings.length > 0 && (
              <ul className="error-text">
                {legalityWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Search the Catalog</h2>
            <input placeholder="Search by card name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search.trim().length >= 2 && (
              <div className="pokemon-grid">
                {searchResults.map((card) => (
                  <TcgCardView key={card.cardId} card={card} count={counts.get(card.cardId)} onClick={() => addCard(card.cardId)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="button" onClick={handleConfirm} disabled={isSubmitting || totalCards !== DECK_SIZE || legalityWarnings.length > 0}>
        {opponentId ? "Confirm & Battle" : "Save Deck"}
      </button>
    </div>
  );
}
