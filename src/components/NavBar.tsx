import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { isMockApi } from "../api";

export function NavBar() {
  const { user, isAuthenticated, signIn, signOut, isConfigured } = useAuth();

  return (
    <header className="nav-bar">
      <Link to="/" className="nav-bar__brand">
        Poké Battle
      </Link>
      {isMockApi && <span className="nav-bar__badge">MOCK API</span>}
      <nav className="nav-bar__links">
        <Link to="/">Lobby</Link>
        <Link to="/trainer">Trainer</Link>
      </nav>
      <div className="nav-bar__auth">
        {isAuthenticated ? (
          <>
            <span className="nav-bar__user">{user?.name ?? user?.email ?? "Trainer"}</span>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" onClick={() => signIn()} disabled={!isConfigured} title={!isConfigured ? "Cognito not configured yet" : undefined}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
