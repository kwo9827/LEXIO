// utils/chipSettlement.ts
import type { Tile } from "../utils/validateTiles";

interface PlayerData {
  playerId: string;
  nickname: string;
  hand: Tile[];
  chips: number;
}

interface SettlementResult {
  updatedChips: Record<string, number>;
  logs: string[];
  winnerId: string;
}

function countPenalty(hand: Tile[]): number {
  const count = hand.length;
  const hasTwo = hand.some((tile) => tile.includes("2"));
  return hasTwo ? count * 2 : count;
}

export function settleChips(players: PlayerData[]): SettlementResult {
  const logs: string[] = [];
  const updatedChips: Record<string, number> = {};

  // 1. 우승자 찾기 (hand.length === 0)
  const winner = players.find((p) => p.hand.length === 0);
  if (!winner) throw new Error("승자를 찾을 수 없습니다.");

  logs.push(`🎉 1등: ${winner.nickname}`);

  // 2. 패널티 계산
  const penalties = players.map((p) => ({
    playerId: p.playerId,
    penalty: countPenalty(p.hand),
  }));

  // 3. 칩 정산
  const winnerId = winner.playerId;
  let winnerGain = 0;

  for (const p of players) {
    if (p.playerId === winnerId) continue;

    const penalty = penalties.find((x) => x.playerId === p.playerId)?.penalty || 0;
    winnerGain += penalty;
    updatedChips[p.playerId] = p.chips - penalty;
    logs.push(`💸 ${p.nickname}: -${penalty}개`);
  }

  updatedChips[winnerId] = winner.chips + winnerGain;
  logs.unshift(`💰 ${winner.nickname}: +${winnerGain}개`);

  // 4. 꼴지 찾기
  const sorted = [...players]
    .filter((p) => p.playerId !== winnerId)
    .sort((a, b) => countPenalty(b.hand) - countPenalty(a.hand));
  const loser = sorted[0];

  for (const p of sorted.slice(1)) {
    const diff = countPenalty(p.hand) - countPenalty(loser.hand);
    const hasTwo = p.hand.some((tile) => tile.includes("2"));
    const gain = hasTwo ? diff * 2 : diff;

    if (gain > 0) {
      updatedChips[p.playerId] += gain;
      updatedChips[loser.playerId] -= gain;
      logs.push(`📦 ${p.nickname} → ${loser.nickname}: ${gain}개 전달`);
    }
  }

  return {
    updatedChips,
    logs,
    winnerId,
  };
}
