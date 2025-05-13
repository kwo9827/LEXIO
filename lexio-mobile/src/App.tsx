import { Routes, Route, Navigate } from "react-router-dom";
import LobbyPage from "./pages/LobbyPage";
import ResultPage from "./pages/ResultPage";
import GameRoomPage from "./pages/GameRoomPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/lobby" />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/room/:roomId" element={<GameRoomPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  );
}

export default App;
