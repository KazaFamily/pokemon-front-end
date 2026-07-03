import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { LobbyPage } from "./pages/LobbyPage";
import { TrainerSetupPage } from "./pages/TrainerSetupPage";
import { BattlePage } from "./pages/BattlePage";
import { SignInPage } from "./pages/SignInPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/battle/:battleId" element={<BattlePage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/trainer"
            element={
              <ProtectedRoute>
                <TrainerSetupPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
