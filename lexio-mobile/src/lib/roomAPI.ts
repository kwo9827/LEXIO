import { ref, set, get, update, onValue } from "firebase/database";
import { db } from "../firebase/firebase";
import type { Unsubscribe } from "firebase/database";
import { generateAllTiles, shuffleArray } from "../utils/tileSet";

// 플레이어 구조 정의
export interface Player {
  nickname: string;
  hand: string[]; // 타일 리스트
}

interface RoomData {
  players: Record<string, Player>;
  hostId: string;
  turn: string;
  playedTiles: string[];
  phase: string;
  turnStartAt?: number; // ✅ 이 줄을 추가해줘!
}

// 방 생성 함수
export async function createRoom(roomCode: string, nickname: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);

  const playerId = generatePlayerId();

  const initialPlayer: Player = {
    nickname,
    hand: [], // 나중에 타일 분배 시 여기에 채울 예정
  };

  await set(roomRef, {
    players: {
      [playerId]: initialPlayer,
    },
    hostId: playerId,
    turn: playerId,
    playedTiles: [],
    phase: "waiting", // 대기 상태
  });

  return playerId;
}

// 플레이어 ID를 랜덤으로 생성하는 유틸 함수
function generatePlayerId() {
  return "user_" + Math.random().toString(36).substring(2, 8);
}

// 방 참가 함수
export async function joinRoom(roomCode: string, nickname: string): Promise<string | null> {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    alert("존재하지 않는 방입니다!");
    return null;
  }

  //   const roomData = snapshot.val();

  // 새로운 플레이어 ID 생성
  const playerId = generatePlayerId();

  // 해당 플레이어를 players 항목에 추가
  await update(roomRef, {
    [`players/${playerId}`]: {
      nickname,
      hand: [], // 나중에 타일 나눠줄 때 채워줄 예정
    },
  });

  return playerId;
}

// 실시간 리스너 등록
export function onRoomUpdate(roomCode: string, callback: (roomData: RoomData) => void): Unsubscribe {
  const roomRef = ref(db, `rooms/${roomCode}`);

  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(data);
    }
  });

  return unsubscribe; // 나중에 구독 해제할 수 있음
}

// 타일 제출 함수
export async function submitTiles(roomCode: string, tiles: string[]) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, {
    playedTiles: tiles,
  });
}

// 턴 넘기기
export async function setNextTurn(roomCode: string, currentPlayerId: string, allPlayerIds: string[]) {
  const roomRef = ref(db, `rooms/${roomCode}`);

  // 현재 플레이어가 몇 번째인지 찾기
  const currentIndex = allPlayerIds.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % allPlayerIds.length;
  const nextPlayerId = allPlayerIds[nextIndex];

  await update(roomRef, {
    turn: nextPlayerId,
    turnStartAt: Date.now(), // ✅ 여기 추가
  });
}

export async function dealTiles(roomCode: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const roomData = snapshot.val();
  const players = roomData.players;
  const playerIds = Object.keys(players);

  const allTiles = shuffleArray(generateAllTiles());

  const updatedPlayers: Record<string, Player> = {};

  playerIds.forEach((id, index) => {
    const start = index * 13;
    const end = start + 13;
    const hand = allTiles.slice(start, end);
    updatedPlayers[id] = {
      ...players[id],
      hand,
    };
  });

  await update(roomRef, {
    players: updatedPlayers,
  });
}

export async function setPhase(roomCode: string, phase: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, {
    phase,
  });
}

export async function setTurnStart(roomCode: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, {
    turnStartAt: Date.now(),
  });
}
