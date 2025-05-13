import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onRoomUpdate, submitTiles, setNextTurn, dealTiles, comparecombo, removeTilesFromHand } from "../lib/roomAPI";
import type { Player } from "../lib/roomAPI";
import { getTileImagePath } from "../utils/tileImage";
import { setPhase as updatePhase } from "../lib/roomAPI";
import { validateTiles } from "../utils/validateTiles";
import { RecommendationPanel } from "../components/RecommendationPanel";

function GameRoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const nickname = searchParams.get("nickname") || "익명";
  const playerId = searchParams.get("playerId") || "";
  const navigate = useNavigate();

  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [turn, setTurn] = useState("");
  const [playedTiles, setPlayedTiles] = useState<string[]>([]);
  const [myTiles, setMyTiles] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [hostId, setHostId] = useState("");
  const [phase, setPhase] = useState("waiting"); // ✅ phase 상태

  const [turnStartAt, setTurnStartAt] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  const [currentCombo, setCurrentCombo] = useState<string | null>(null);

  // 내 턴인지 확인하기
  const isMyTurn = turn === playerId && phase === "playing";

  const toggleTile = (tile: string) => {
    setSelectedTiles((prev) => (prev.includes(tile) ? prev.filter((t) => t !== tile) : [...prev, tile]));
  };

  const handleSubmit = async () => {
    const prevType = validateTiles(playedTiles);
    const myType = validateTiles(selectedTiles);

    if (!roomId || selectedTiles.length === 0) return;

    const combination = validateTiles(selectedTiles);
    if (!combination) {
      alert("❌ 유효하지 않은 조합입니다. 다시 선택해주세요.");
      return;
    }

    if (prevType && myType && prevType === myType) {
      const isStronger = compareCombo(selectedTiles, playedTiles) > 0;
      if (!isStronger) {
        alert("이전보다 강한 조합만 낼 수 있습니다.");
        return;
      }
    }

    await submitTiles(roomId, selectedTiles); // 타일 제출
    await removeTilesFromHand(roomId, playerId, selectedTiles); // 🔥 추가된 줄
    await setNextTurn(roomId, playerId, Object.keys(players)); // 🔁 턴 넘김

    setMyTiles((prev) => prev.filter((tile) => !selectedTiles.includes(tile)));
    setSelectedTiles([]);
    setTimeLeft(15);
  };

  const handlePass = async () => {
    if (!roomId) return;

    alert("패스!");
    await setNextTurn(roomId, playerId, Object.keys(players)); // 🔁 턴 넘김
    setSelectedTiles([]);
    setTimeLeft(15); // ✅ 이 줄도 추가
  };

  const handleExit = () => {
    if (confirm("정말 나가시겠습니까?")) {
      navigate("/lobby");
    }
  };

  // 🔄 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onRoomUpdate(roomId, (roomData) => {
      setPlayers(roomData.players || {});
      setTurn(roomData.turn);
      setPlayedTiles(roomData.playedTiles || []);
      setHostId(roomData.hostId); // ✅ 이 줄 추가!
      setPhase(roomData.phase);
      setTurnStartAt(roomData.turnStartAt || 0);

      // 내 타일 동기화
      const myData = roomData.players?.[playerId];
      if (myData) {
        setMyTiles(myData.hand || []);
      }
    });

    return () => unsubscribe();
  }, [roomId, playerId]);

  // 시간계산
  useEffect(() => {
    if (!turnStartAt || !isMyTurn) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const secondsLeft = 15 - Math.floor((now - turnStartAt) / 1000);
      setTimeLeft(Math.max(0, secondsLeft));

      if (secondsLeft <= 0) {
        clearInterval(interval);
        handlePass(); // ✅ 자동 패스
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turnStartAt, isMyTurn]);

  useEffect(() => {
    if (selectedTiles.length === 0) {
      setCurrentCombo(null);
      return;
    }

    const result = validateTiles(selectedTiles);
    setCurrentCombo(result);
  }, [selectedTiles]);

  return (
    <div className="min-h-screen bg-white flex flex-col p-4">
      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          방 코드: <b>{roomId}</b>
        </div>
        <button onClick={handleExit} className="text-sm text-red-500 underline">
          나가기
        </button>
      </div>

      {/* 플레이어 정보 */}
      <div className="text-center font-bold text-xl mb-2">{nickname}님의 게임방</div>

      {/* 플레이어 목록 */}
      <div className="mb-4 text-sm text-gray-800">
        <h3 className="font-semibold mb-1">👥 참여자:</h3>
        <ul className="list-disc list-inside">
          {Object.entries(players).map(([id, p]) => (
            <li key={id}>
              {p.nickname} {id === playerId && "(나)"}
            </li>
          ))}
        </ul>
      </div>

      {/* 턴 순서 UI */}
      <div className="flex justify-center gap-3 mb-4">
        {Object.entries(players).map(([id, player]) => (
          <div
            key={id}
            className={`px-3 py-1 rounded-full border text-sm ${
              turn === id ? "bg-green-200 font-bold animate-pulse" : "bg-gray-100"
            }`}
          >
            {player.nickname} {id === playerId && "(나)"}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-red-500 mb-2">{isMyTurn ? `남은 시간: ${timeLeft}초` : ""}</div>

      {/* 제출된 타일 */}
      <div className="bg-gray-100 rounded-md p-4 mb-4 text-center min-h-[60px]">
        {playedTiles.length > 0
          ? playedTiles.map((tile, i) => (
              <span key={i} className="inline-block text-2xl mx-1">
                <img src={getTileImagePath(tile)} alt={tile} className="w-12 h-auto" />
              </span>
            ))
          : "제출된 타일이 없습니다."}
      </div>

      {/* 내 타일 */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {myTiles.map((tile, i) => (
          <button
            key={i}
            onClick={() => toggleTile(tile)}
            className={`text-2xl px-3 py-2 rounded-lg ${
              selectedTiles.includes(tile)
                ? "border-4 border-blue-500 bg-blue-300"
                : "border border-gray-300 bg-yellow-200"
            }`}
          >
            <img src={getTileImagePath(tile)} alt={tile} className="w-12 h-auto" />
          </button>
        ))}
      </div>

      {/* 버튼 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleSubmit}
          className={`py-2 px-6 rounded-lg text-lg ${
            isMyTurn ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isMyTurn}
        >
          제출
        </button>
        <button
          onClick={handlePass}
          className={`py-2 px-6 rounded-lg text-lg ${
            isMyTurn ? "bg-gray-400 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isMyTurn}
        >
          패스
        </button>
      </div>

      {/* 게임 시작 버튼 - host만 보임 */}
      {playerId === hostId && phase === "waiting" && (
        <div className="text-center mb-6">
          <button
            onClick={async () => {
              await dealTiles(roomId!);
              await updatePhase(roomId!, "playing");
            }}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg text-lg"
          >
            🎮 게임 시작
          </button>
        </div>
      )}

      {selectedTiles.length > 0 && (
        <div className="text-center text-sm mb-4">
          {currentCombo ? (
            <span className="text-green-600 font-semibold">✅ 현재 선택한 조합: {currentCombo}</span>
          ) : (
            <span className="text-red-500 font-semibold">❌ 유효하지 않은 조합입니다</span>
          )}
        </div>
      )}

      <RecommendationPanel
        myTiles={myTiles}
        onSelect={setSelectedTiles}
        requiredType={validateTiles(playedTiles)} // 🔧 현재 플레이 조합의 타입
      />
    </div>
  );
}

export default GameRoomPage;
