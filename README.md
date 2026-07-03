# pokemon-front-end

React SPA for a two-player (and later AI-vs-AI) Pokémon battle game. Deploys to GitHub Pages on every push to `master`. Talks to the serverless backend in `pokemon-battle-apis` (API Gateway + Lambda + DynamoDB + Cognito).

Login is name-only, no password: `POST /auth/login` either creates a new trainer (with 20 random battle cards) or logs back into an existing one by exact name match, minting Cognito tokens server-side. There's no real account security here - it's a personal/friends project, not a public one.

## Stack

- Vite + React + TypeScript
- React Router
- Polling-based battle state (`useBattleState`), isolated so it can be swapped for a WebSocket/SSE transport later without touching callers

## Structure

- `src/pages` - Lobby (name login + battle cards + reroll), battle setup (pick your roster), battle view
- `src/components` - Pokémon card, move selector, HP bar, battle log, nav bar
- `src/api` - fetch client (`client.ts`) and a mock in-memory implementation (`mock.ts`), switched automatically by whether `VITE_API_BASE_URL` is set (`index.ts`)
- `src/auth` - `AuthProvider`/`useAuth` (calls `POST /auth/login`, stores the returned Cognito tokens), `ProtectedRoute`
- `src/hooks` - `useBattleState` polling hook

## Local development

```
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to point at a real backend. Leave `VITE_API_BASE_URL` unset to run against the built-in mock API - this is the default and lets the whole app (login, battle cards, roster picking, battles) be exercised without a deployed backend.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `master`, injecting `VITE_API_BASE_URL` from the `API_BASE_URL` repo secret.
