import { createRoom, joinRoom } from "../lib/roomAPI"; // 상단에 추가!
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function LobbyPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleCreateRoom = async () => {
    if (!nickname) {
      alert("닉네임을 먼저 입력해주세요!");
      return;
    }

    // 방 코드 생성
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // ✅ Firebase에 방 생성
    const playerId = await createRoom(newRoomCode, nickname);

    // ✅ 페이지 이동 + 쿼리로 방 코드, 닉네임, 플레이어 ID 전달
    navigate(`/room/${newRoomCode}?nickname=${nickname}&playerId=${playerId}`);
  };

  const handleJoinRoom = async () => {
    if (!nickname || !roomCode) {
      alert("닉네임과 방 코드를 입력해주세요!");
      return;
    }

    const playerId = await joinRoom(roomCode, nickname);

    if (!playerId) return; // 방이 없을 때 중단

    navigate(`/room/${roomCode}?nickname=${nickname}&playerId=${playerId}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-yellow-100 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center">🎲 렉시오 모바일</h1>

      <input
        type="text"
        placeholder="닉네임을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="w-full max-w-xs mb-4 p-3 text-lg rounded-lg border border-gray-300"
      />

      <input
        type="text"
        placeholder="방 코드 입력"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        className="w-full max-w-xs mb-4 p-3 text-lg rounded-lg border border-gray-300"
      />

      <button
        onClick={handleJoinRoom}
        className="w-full max-w-xs bg-blue-500 text-white text-lg py-3 rounded-lg mb-2 hover:bg-blue-600"
      >
        입장하기
      </button>

      <button
        onClick={handleCreateRoom}
        className="w-full max-w-xs bg-green-500 text-white text-lg py-3 rounded-lg hover:bg-green-600"
      >
        새 방 만들기
      </button>
    </div>
  );
}

export default LobbyPage;
