import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onRoomUpdate, submitTiles, setNextTurn, dealTiles, removeTilesFromHand } from "../lib/roomAPI";
import type { Player } from "../lib/roomAPI";
import { getTileImagePath } from "../utils/tileImage";
import { setPhase as updatePhase } from "../lib/roomAPI";
import { validateTiles } from "../utils/validateTiles";
import { RecommendationPanel } from "../components/RecommendationPanel";
import { compareCombo } from "../utils/compareCombo";
import { settleChips } from "../utils/chipSettlement";
import RoundResultModal from "../components/RoundResultModal";
import { updatePlayerChips } from "../lib/roomAPI";
import { resetRound } from "../lib/roomAPI";
import { remove, ref, get } from "firebase/database";
import { db } from "../firebase/firebase";

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
  const [phase, setPhase] = useState("waiting");
  const [turnStartAt, setTurnStartAt] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentCombo, setCurrentCombo] = useState<string | null>(null);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [roundLogs, setRoundLogs] = useState<string[]>([]);
  const [roundWinnerId, setRoundWinnerId] = useState<string | null>(null);

  const isMyTurn = turn === playerId && phase === "playing";

  const toggleTile = (tile: string) => {
    setSelectedTiles((prev) => (prev.includes(tile) ? prev.filter((t) => t !== tile) : [...prev, tile]));
  };

  const handleSubmit = async () => {
    const myType = validateTiles(selectedTiles);
    if (!myType) {
      alert("❌ 유효하지 않은 조합입니다. 다시 선택해주세요.");
      return;
    }

    const prevType = validateTiles(playedTiles);
    if (prevType && myType === prevType) {
      const isStronger = compareCombo(selectedTiles, playedTiles) > 0;
      if (!isStronger) {
        alert("이전보다 강한 조합만 낼 수 있습니다.");
        return;
      }
    }

    const fiveRanks = ["straight", "flush", "fullhouse", "fourcard", "straightflush"];
    if (prevType && myType && prevType !== myType) {
      if (fiveRanks.includes(prevType) && fiveRanks.includes(myType)) {
        const rank = {
          straight: 1,
          flush: 2,
          fullhouse: 3,
          fourcard: 4,
          straightflush: 5,
        };
        if (rank[myType as keyof typeof rank] < rank[prevType as keyof typeof rank]) {
          alert("더 낮은 족보는 낼 수 없습니다.");
          return;
        }
      } else {
        alert("❌ 같은 족보 타입만 낼 수 있습니다.");
        return;
      }
    }

    if (!roomId || selectedTiles.length === 0) return;

    await submitTiles(roomId, selectedTiles, playerId);
    await removeTilesFromHand(roomId, playerId, selectedTiles);

    const myHandCount = players[playerId]?.hand?.length ?? 0;
    const isWinner = myHandCount - selectedTiles.length === 0;

    const remainingTiles = myTiles.filter((tile) => !selectedTiles.includes(tile));
    setMyTiles(remainingTiles);
    setSelectedTiles([]);
    setTimeLeft(20);

    if (isWinner) {
      const playerArray = Object.entries(players).map(([id, p]) => ({
        playerId: id,
        nickname: p.nickname,
        hand: id === playerId ? [] : p.hand,
        chips: p.chips ?? 50,
      }));

      const result = settleChips(playerArray);
      const isGameOver = Object.values(result.updatedChips).some((chips) => chips <= 0);

      await updatePlayerChips(roomId, result.updatedChips);

      if (isGameOver) {
        navigate("/result", { state: result });
      } else {
        setRoundLogs(result.logs);
        setRoundWinnerId(result.winnerId);
        setShowRoundModal(true);
      }

      return;
    }

    await setNextTurn(roomId, playerId, Object.keys(players));
  };

  const handlePass = async () => {
    if (!roomId) return;

    const myHandCount = players[playerId]?.hand.length ?? 0;
    if (myHandCount === 0) {
      const playerArray = Object.entries(players).map(([id, p]) => ({
        playerId: id,
        nickname: p.nickname,
        hand: id === playerId ? [] : p.hand,
        chips: p.chips ?? 50,
      }));

      const result = settleChips(playerArray);
      const isGameOver = Object.values(result.updatedChips).some((chips) => chips <= 0);

      await updatePlayerChips(roomId, result.updatedChips);

      if (isGameOver) {
        navigate("/result", { state: result });
      } else {
        setRoundLogs(result.logs);
        setRoundWinnerId(result.winnerId);
        setShowRoundModal(true);
      }

      return;
    }

    alert("패스!");
    await setNextTurn(roomId, playerId, Object.keys(players), true);
    setSelectedTiles([]);
    setTimeLeft(20);
  };

  const handleExit = async () => {
    if (!roomId || !playerId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);

    const snapshot = await get(roomRef);
    const roomData = snapshot.val();

    if (confirm("정말 나가시겠습니까?")) {
      if (roomData.hostId === playerId) {
        // ✅ 내가 호스트면 방 전체 삭제
        await remove(roomRef);
      } else {
        // ✅ 내가 호스트가 아니면 내 플레이어 정보만 삭제
        await remove(playerRef);
      }

      navigate("/lobby");
    }
  };

  const handleNextRound = async () => {
    if (!roomId || !roundWinnerId) return;

    await dealTiles(roomId); // ✅ 타일 새로 분배
    await resetRound(roomId, roundWinnerId); // ✅ 라운드 초기화 (턴, 패스, 타이머)

    setShowRoundModal(false); // 모달 닫기
  };
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onRoomUpdate(roomId, (roomData) => {
      (async () => {
        const allPlayers = roomData.players || {};

        setPlayers(allPlayers);
        setTurn(roomData.turn);
        setPlayedTiles(roomData.playedTiles || []);
        setHostId(roomData.hostId);
        setPhase(roomData.phase);
        setTurnStartAt(roomData.turnStartAt || 0);

        const myData = allPlayers[playerId];
        if (myData) {
          setMyTiles(myData.hand || []);
        }

        if (roundWinnerId) return; // 중복 정산 방지

        const winnerId = Object.entries(allPlayers).find(([, p]) => p?.hand?.length === 0)?.[0];
        if (winnerId) {
          const playerArray = Object.entries(allPlayers).map(([id, p]) => ({
            playerId: id,
            nickname: p.nickname,
            hand: p.hand,
            chips: p.chips ?? 50,
          }));

          const result = settleChips(playerArray);
          const isGameOver = Object.values(result.updatedChips).some((chips) => chips <= 0);

          await updatePlayerChips(roomId, result.updatedChips);

          if (isGameOver) {
            navigate("/result", { state: result });
          } else {
            setRoundLogs(result.logs);
            setRoundWinnerId(result.winnerId);
            setShowRoundModal(true);
          }
        }
      })();
    });

    return () => unsubscribe();
  }, [roomId, playerId, roundWinnerId]);

  useEffect(() => {
    if (!turnStartAt || !isMyTurn) return;
    let called = false;

    const interval = setInterval(() => {
      const now = Date.now();
      const secondsLeft = 15 - Math.floor((now - turnStartAt) / 1000);
      setTimeLeft(Math.max(0, secondsLeft));

      if (secondsLeft <= 0 && !called) {
        called = true;
        clearInterval(interval);
        handlePass();
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
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          방 코드: <b>{roomId}</b>
        </div>
        <button onClick={handleExit} className="text-sm text-red-500 underline">
          나가기
        </button>
      </div>

      <div className="text-center font-bold text-xl mb-2">{nickname}님의 게임방</div>

      <div className="mb-4 text-sm text-gray-800">
        <h3 className="font-semibold mb-1">👥 참여자:</h3>
        <ul className="list-disc list-inside">
          {Object.entries(players).map(([id, player]) => (
            <div
              key={id}
              className={`px-3 py-1 rounded-full border text-sm ${
                turn === id ? "bg-green-200 font-bold animate-pulse" : "bg-gray-100"
              }`}
            >
              {player.nickname} {id === playerId && "(나)"} - 💰 {player.chips ?? 0}개
            </div>
          ))}
        </ul>
      </div>

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

      <div className="bg-gray-100 rounded-md p-4 mb-4 text-center min-h-[60px]">
        {playedTiles.length > 0
          ? playedTiles.map((tile, i) => (
              <span key={i} className="inline-block text-2xl mx-1">
                <img src={getTileImagePath(tile)} alt={tile} className="w-12 h-auto" />
              </span>
            ))
          : "제출된 타일이 없습니다."}
      </div>

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

      <RecommendationPanel myTiles={myTiles} onSelect={setSelectedTiles} lastPlayedTiles={playedTiles} />
      <RoundResultModal visible={showRoundModal} logs={roundLogs} onClose={handleNextRound} />
    </div>
  );
}

export default GameRoomPage;
