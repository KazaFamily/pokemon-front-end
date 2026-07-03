# pokemon-front-end

React SPA for a two-player (and later AI-vs-AI) Pokémon battle game. Deploys to GitHub Pages on every push to `master`. Talks to the serverless backend in `pokemon-battle-apis` (API Gateway + Lambda + DynamoDB) and authenticates via a Cognito User Pool with Google as a federated identity provider.

## Stack

- Vite + React + TypeScript
- React Router
- Direct Cognito Hosted UI integration (Authorization Code + PKCE) - no Amplify
- Polling-based battle state (`useBattleState`), isolated so it can be swapped for a WebSocket/SSE transport later without touching callers

## Structure

- `src/pages` - Lobby, Trainer setup, Battle view, sign-in/callback
- `src/components` - Pokémon card, move selector, HP bar, battle log, nav bar
- `src/api` - fetch client (`client.ts`) and a mock in-memory implementation (`mock.ts`), switched automatically by whether `VITE_API_BASE_URL` is set (`index.ts`)
- `src/auth` - Cognito config, PKCE helpers, `AuthProvider`/`useAuth`, `ProtectedRoute`
- `src/hooks` - `useBattleState` polling hook

## Local development

```
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to point at a real backend. Leave `VITE_API_BASE_URL` unset to run against the built-in mock API - this is the default and lets the whole app (trainer creation, roster setup, battles) be exercised without a deployed backend. Protected routes also bypass auth automatically while running against the mock API, since there's no Cognito pool to sign in against yet.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `master`, injecting `VITE_API_BASE_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, and `VITE_COGNITO_DOMAIN` from repo secrets (`API_BASE_URL`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_DOMAIN`).
