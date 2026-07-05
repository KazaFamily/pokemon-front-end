import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { isMockApi } from "../api";

export function NavBar() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <header className="nav-bar">
      <Link to="/" className="nav-bar__brand">
        Poké Battle
      </Link>
      {isMockApi && <span className="nav-bar__badge">MOCK API</span>}
      <div className="nav-bar__links" />
      {isAuthenticated && (
        <div className="nav-bar__auth">
          <span className="nav-bar__user">{user?.name}</span>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
