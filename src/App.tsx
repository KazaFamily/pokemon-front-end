import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { HomePage } from "./pages/HomePage";
import { BattleLobbyPage } from "./pages/BattleLobbyPage";
import { BattleSetupPage } from "./pages/BattleSetupPage";
import { BattlePage } from "./pages/BattlePage";
import { TcgLobbyPage } from "./pages/TcgLobbyPage";
import { TcgDeckSetupPage } from "./pages/TcgDeckSetupPage";
import { TcgBattlePage } from "./pages/TcgBattlePage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/battle/lobby"
            element={
              <ProtectedRoute>
                <BattleLobbyPage />
              </ProtectedRoute>
            }
          />
          <Route path="/battle/:battleId" element={<BattlePage />} />
          <Route
            path="/battle/setup"
            element={
              <ProtectedRoute>
                <BattleSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tcg/lobby"
            element={
              <ProtectedRoute>
                <TcgLobbyPage />
              </ProtectedRoute>
            }
          />
          <Route path="/tcg/battle/:battleId" element={<TcgBattlePage />} />
          <Route
            path="/tcg/setup"
            element={
              <ProtectedRoute>
                <TcgDeckSetupPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
