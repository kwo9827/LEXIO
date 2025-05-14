import { ref, set, get, update, onValue } from "firebase/database";
import { db } from "../firebase/firebase";
import type { Unsubscribe } from "firebase/database";
import { generateAllTiles, shuffleArray } from "../utils/tileSet";

export interface Player {
  nickname: string;
  hand: string[];
  chips: number;
}

interface RoomData {
  players: Record<string, Player>;
  hostId: string;
  turn: string;
  playedTiles: string[];
  phase: string;
  turnStartAt?: number;
  passCount?: number;
  lastPlayedBy?: string;
}

export async function createRoom(roomCode: string, nickname: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const playerId = generatePlayerId();

  const initialPlayer: Player = {
    nickname,
    hand: [],
    chips: 50,
  };

  await set(roomRef, {
    players: {
      [playerId]: initialPlayer,
    },
    hostId: playerId,
    turn: playerId,
    playedTiles: [],
    phase: "waiting",
    passPlayers: [],
  });

  return playerId;
}

function generatePlayerId() {
  return "user_" + Math.random().toString(36).substring(2, 8);
}

export async function joinRoom(roomCode: string, nickname: string): Promise<string | null> {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    alert("존재하지 않는 방입니다!");
    return null;
  }

  const playerId = generatePlayerId();

  await update(roomRef, {
    [`players/${playerId}`]: {
      nickname,
      hand: [],
      chips: 50,
    },
  });

  return playerId;
}

export function onRoomUpdate(roomCode: string, callback: (roomData: RoomData) => void): Unsubscribe {
  const roomRef = ref(db, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
}

export async function submitTiles(roomCode: string, tiles: string[], playerId: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, {
    playedTiles: tiles,
    lastPlayedBy: playerId,
    passPlayers: [],
  });
}

export async function setNextTurn(
  roomCode: string,
  currentPlayerId: string,
  allPlayerIds: string[],
  isPass: boolean = false
) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const roomSnap = await get(roomRef);
  const roomData = roomSnap.val();

  const lastPlayedBy = roomData.lastPlayedBy || null;
  const passPlayers: string[] = roomData.passPlayers || [];

  const newPassPlayers = isPass ? [...new Set([...passPlayers, currentPlayerId])] : passPlayers;
  const activePlayers = allPlayerIds.filter((id) => id !== lastPlayedBy && !newPassPlayers.includes(id));

  let nextPlayerId = "";
  let currentIndex = allPlayerIds.indexOf(currentPlayerId);
  let tries = 0;

  while (tries < allPlayerIds.length) {
    currentIndex = (currentIndex + 1) % allPlayerIds.length;
    const candidate = allPlayerIds[currentIndex];
    if (!newPassPlayers.includes(candidate)) {
      nextPlayerId = candidate;
      break;
    }
    tries++;
  }

  const isRoundEnd = nextPlayerId === lastPlayedBy || activePlayers.length === 0;

  if (isRoundEnd) {
    await update(roomRef, {
      turn: lastPlayedBy,
      playedTiles: [],
      passPlayers: [],
      turnStartAt: Date.now(),
    });
  } else {
    await update(roomRef, {
      turn: nextPlayerId,
      passPlayers: newPassPlayers,
      turnStartAt: Date.now(),
    });
  }
}

function filterTilesByPlayerCount(allTiles: string[], count: number): string[] {
  const validNumbers =
    count === 5
      ? Array.from({ length: 15 }, (_, i) => i + 1) // 1~15
      : count === 4
      ? Array.from({ length: 12 }, (_, i) => i + 1) // 1~12
      : count === 3
      ? Array.from({ length: 9 }, (_, i) => i + 1) // 1~9
      : [];

  return allTiles.filter((tile) => {
    const num = parseInt(tile.match(/\d+/)?.[0] || "0", 10);
    return validNumbers.includes(num);
  });
}

export async function dealTiles(roomCode: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const roomData = snapshot.val();
  const players = roomData.players;
  const playerIds = Object.keys(players);
  const playerCount = playerIds.length;

  let allTiles = shuffleArray(generateAllTiles());
  allTiles = filterTilesByPlayerCount(allTiles, playerCount);

  const TILE_PER_PLAYER = 12;
  if (playerCount * TILE_PER_PLAYER > allTiles.length) {
    console.error("타일이 부족합니다. 인원을 확인해주세요.");
    return;
  }

  const updatedPlayers: Record<string, Player> = {};
  let cloud3Owner: string | null = null;

  playerIds.forEach((id, index) => {
    const start = index * TILE_PER_PLAYER;
    const end = start + TILE_PER_PLAYER;
    const hand = allTiles.slice(start, end);

    if (hand.includes("cloud3")) {
      cloud3Owner = id;
    }

    updatedPlayers[id] = {
      ...players[id],
      hand,
    };
  });

  await update(roomRef, {
    players: updatedPlayers,
    turn: cloud3Owner || playerIds[0],
  });
}

export async function setPhase(roomCode: string, phase: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, { phase });
}

export async function setTurnStart(roomCode: string) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await update(roomRef, { turnStartAt: Date.now() });
}

export async function removeTilesFromHand(roomCode: string, playerId: string, tilesToRemove: string[]) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) return;

  const hand: string[] = snapshot.val().players[playerId]?.hand || [];
  const newHand = hand.filter((tile: string) => !tilesToRemove.includes(tile));

  await update(roomRef, {
    [`players/${playerId}/hand`]: newHand,
  });
}

export async function updatePlayerChips(roomCode: string, chipsMap: Record<string, number>) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) return;

  const updates: Record<string, number> = {};
  Object.entries(chipsMap).forEach(([playerId, newChips]) => {
    updates[`players/${playerId}/chips`] = newChips;
  });

  await update(roomRef, updates);
}

export async function resetRound(roomId: string, newTurnId: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  await update(roomRef, {
    playedTiles: [],
    passPlayers: [],
    turn: newTurnId,
    phase: "playing",
    turnStartAt: Date.now(),
  });
}
