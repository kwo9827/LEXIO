// src/utils/recommendationUtils.ts
import type { Tile } from "./validateTiles";
import { validateTiles } from "./validateTiles";
import { compareCombo } from "./compareCombo";

const fiveComboRank = {
  straight: 1,
  flush: 2,
  fullhouse: 3,
  fourcard: 4,
  straightflush: 5,
} as const;

function makeKey(combo: Tile[]) {
  return combo.slice().sort().join("|");
}

function isBetterCombo(combo: Tile[], last: Tile[] | undefined, sameTypeOnly: boolean): boolean {
  if (!last || last.length === 0) return true;
  const typeCombo = validateTiles(combo);
  const typeLast = validateTiles(last);

  if (!typeCombo || !typeLast) return false;

  if (sameTypeOnly && typeCombo !== typeLast) return false;

  if (typeCombo in fiveComboRank && typeLast in fiveComboRank) {
    const rankCombo = fiveComboRank[typeCombo as keyof typeof fiveComboRank];
    const rankLast = fiveComboRank[typeLast as keyof typeof fiveComboRank];
    if (rankCombo < rankLast) return false;
    if (rankCombo > rankLast) return true;
  }

  return compareCombo(combo, last) > 0;
}

export function getValidSingles(myTiles: Tile[], lastTiles?: Tile[]): Tile[][] {
  return myTiles
    .map((t) => [t])
    .filter((combo) => validateTiles(combo) === "single")
    .filter((combo) => isBetterCombo(combo, lastTiles, true));
}

export function getValidPairs(myTiles: Tile[], lastTiles?: Tile[]): Tile[][] {
  const results: Tile[][] = [];
  const used = new Set<string>();

  for (let i = 0; i < myTiles.length; i++) {
    for (let j = i + 1; j < myTiles.length; j++) {
      const combo = [myTiles[i], myTiles[j]];
      if (validateTiles(combo) !== "pair") continue;

      const key = makeKey(combo);
      if (used.has(key)) continue;
      used.add(key);

      if (isBetterCombo(combo, lastTiles, true)) results.push(combo);
    }
  }

  return results;
}

export function getValidTriples(myTiles: Tile[], lastTiles?: Tile[]): Tile[][] {
  const results: Tile[][] = [];
  const used = new Set<string>();

  for (let i = 0; i < myTiles.length; i++) {
    for (let j = i + 1; j < myTiles.length; j++) {
      for (let k = j + 1; k < myTiles.length; k++) {
        const combo = [myTiles[i], myTiles[j], myTiles[k]];
        if (validateTiles(combo) !== "triple") continue;

        const key = makeKey(combo);
        if (used.has(key)) continue;
        used.add(key);

        if (isBetterCombo(combo, lastTiles, true)) results.push(combo);
      }
    }
  }

  return results;
}

export function getValidFives(myTiles: Tile[], lastTiles?: Tile[]): Tile[][] {
  const results: Tile[][] = [];
  const used = new Set<string>();
  const fiveTypes = Object.keys(fiveComboRank);

  for (let a = 0; a < myTiles.length; a++) {
    for (let b = a + 1; b < myTiles.length; b++) {
      for (let c = b + 1; c < myTiles.length; c++) {
        for (let d = c + 1; d < myTiles.length; d++) {
          for (let e = d + 1; e < myTiles.length; e++) {
            const combo = [myTiles[a], myTiles[b], myTiles[c], myTiles[d], myTiles[e]];
            const comboType = validateTiles(combo);
            if (!comboType || !fiveTypes.includes(comboType)) continue;

            const key = makeKey(combo);
            if (used.has(key)) continue;
            used.add(key);

            if (isBetterCombo(combo, lastTiles, false)) results.push(combo);
          }
        }
      }
    }
  }

  return results;
}
