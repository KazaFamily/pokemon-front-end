import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { LobbyPage } from "./pages/LobbyPage";
import { BattleSetupPage } from "./pages/BattleSetupPage";
import { BattlePage } from "./pages/BattlePage";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/battle/:battleId" element={<BattlePage />} />
          <Route
            path="/battle/setup"
            element={
              <ProtectedRoute>
                <BattleSetupPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
