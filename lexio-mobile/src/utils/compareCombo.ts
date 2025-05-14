// src/utils/compareCombo.ts
import type { Tile } from "./validateTiles";
import { validateTiles } from "./validateTiles";

export const shapeOrder = { cloud: 0, star: 1, moon: 2, sun: 3 } as const;

function getTripleValue(parsed: { num: number }[]): number {
  const counts: Record<number, number> = {};
  for (const t of parsed) counts[t.num] = (counts[t.num] || 0) + 1;
  return +Object.keys(counts).find((k) => counts[+k] === 3)!;
}

function getGroupValue(parsed: { num: number }[], count: number): number {
  const counts: Record<number, number> = {};
  for (const t of parsed) counts[t.num] = (counts[t.num] || 0) + 1;
  return +Object.keys(counts).find((k) => counts[+k] === count)!;
}

function getStraightHighValue(tiles: Tile[]): { num: number; shape: number } {
  const parsed = tiles.map((t) => {
    const num = parseInt(t.match(/\d+/)?.[0] || "0", 10);
    const shape = t.match(/[a-z]+/)?.[0] as keyof typeof shapeOrder;
    const adjustedNum = num === 1 ? 16 : num === 2 ? 17 : num;
    return { num: adjustedNum, shape: shapeOrder[shape] };
  });

  parsed.sort((a, b) => a.num - b.num);
  return parsed[parsed.length - 1];
}

function getStraightPriority(tiles: Tile[]): number {
  const nums = tiles.map((t) => parseInt(t.match(/\d+/)?.[0] || "0", 10));
  const has1 = nums.includes(1);
  const has2 = nums.includes(2);

  if (has1 && has2) return 3; // 가장 강함
  if (has2) return 2; // 그다음
  return 1; // 일반 스트레이트
}

export function normalizeTiles(tiles: Tile[]): Tile[] {
  return tiles
    .slice()
    .map((t) => {
      const num = parseInt(t.match(/\d+/)?.[0] || "0", 10);
      const shape = t.match(/[a-z]+/)?.[0] || "";
      const adjustedNum = num === 1 ? 16 : num === 2 ? 17 : num;
      return {
        raw: t,
        sortKey: `${adjustedNum}-${shapeOrder[shape as keyof typeof shapeOrder]}`,
      };
    })
    .sort((a, b) => (a.sortKey > b.sortKey ? 1 : -1))
    .map((obj) => obj.raw);
}

export function compareCombo(a: Tile[], b: Tile[]): number {
  const typeA = validateTiles(a);
  const typeB = validateTiles(b);
  if (!typeA || !typeB || a.length !== b.length || typeA !== typeB) return 0;

  const parseTile = (t: Tile) => {
    const num = parseInt(t.match(/\d+/)?.[0] || "0", 10);
    const shape = t.match(/[a-z]+/)?.[0] as keyof typeof shapeOrder;
    const adjustedNum = num === 1 ? 16 : num === 2 ? 17 : num;
    return { num: adjustedNum, shape: shapeOrder[shape] };
  };

  const parseTiles = (tiles: Tile[]) =>
    tiles.map(parseTile).sort((a, b) => {
      if (a.num !== b.num) return a.num - b.num;
      return a.shape - b.shape;
    });

  const tilesA = parseTiles(a);
  const tilesB = parseTiles(b);

  switch (typeA) {
    case "single": {
      const [aTile] = tilesA;
      const [bTile] = tilesB;
      if (aTile.num !== bTile.num) return aTile.num - bTile.num;
      return aTile.shape - bTile.shape;
    }
    case "pair": {
      for (let i = tilesA.length - 1; i >= 0; i--) {
        if (tilesA[i].num !== tilesB[i].num) return tilesA[i].num - tilesB[i].num;
        if (tilesA[i].shape !== tilesB[i].shape) return tilesA[i].shape - tilesB[i].shape;
      }
      return 0;
    }
    case "triple": {
      return tilesA[0].num - tilesB[0].num;
    }
    case "fullhouse": {
      const tripleA = getTripleValue(tilesA);
      const tripleB = getTripleValue(tilesB);
      return tripleA - tripleB;
    }
    case "fourcard": {
      const fourA = getGroupValue(tilesA, 4);
      const fourB = getGroupValue(tilesB, 4);
      return fourA - fourB;
    }
    case "straight":
    case "straightflush": {
      const prioA = getStraightPriority(a);
      const prioB = getStraightPriority(b);
      if (prioA !== prioB) return prioA - prioB;

      const maxA = getStraightHighValue(a);
      const maxB = getStraightHighValue(b);
      if (maxA.num !== maxB.num) return maxA.num - maxB.num;
      return maxA.shape - maxB.shape;
    }
    case "flush": {
      for (let i = tilesA.length - 1; i >= 0; i--) {
        if (tilesA[i].num !== tilesB[i].num) return tilesA[i].num - tilesB[i].num;
      }
      return tilesA[tilesA.length - 1].shape - tilesB[tilesB.length - 1].shape;
    }
    default:
      return 0;
  }
}
