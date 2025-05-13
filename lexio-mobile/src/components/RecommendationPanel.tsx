// src/components/RecommendationPanel.tsx
import type { Tile } from "../utils/validateTiles";
import { validateTiles } from "../utils/validateTiles";
import { getTileImagePath } from "../utils/tileImage";

interface RecommendationPanelProps {
  myTiles: Tile[];
  onSelect: (tiles: Tile[]) => void;
  requiredType?: string | null;
  lastPlayedTiles?: Tile[];
}

export function RecommendationPanel({ myTiles, onSelect, requiredType, lastPlayedTiles }: RecommendationPanelProps) {
  const recommendations = generateValidCombinations(myTiles, requiredType, lastPlayedTiles);

  return (
    <div className="bg-gray-50 border p-4 rounded mb-6">
      <h3 className="text-md font-semibold mb-2">🔍 추천 조합</h3>
      {recommendations.length === 0 ? (
        <p className="text-sm text-gray-500">추천할 수 있는 조합이 없습니다.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {recommendations.map((combo, idx) => (
            <li key={idx}>
              <button
                onClick={() => onSelect(combo)}
                className="px-2 py-1 border rounded text-sm hover:bg-blue-100 flex gap-1"
              >
                {combo.map((tile, i) => (
                  <img key={i} src={getTileImagePath(tile)} alt={tile} className="w-6 h-auto" />
                ))}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function generateValidCombinations(myTiles: Tile[], requiredType?: string | null, lastPlayedTiles?: Tile[]): Tile[][] {
  const results: Tile[][] = [];
  const used = new Set<string>();
  const lastComboType = validateTiles(lastPlayedTiles || []);

  for (let size = 1; size <= 5; size++) {
    const combos = getCombinations(myTiles, size);
    for (const combo of combos) {
      const key = combo.slice().sort().join("|");
      if (used.has(key)) continue;

      const comboType = validateTiles(combo);
      if (!comboType) continue;
      if (requiredType && comboType !== requiredType) continue;

      if (lastComboType && comboType === lastComboType && lastPlayedTiles) {
        if (compareCombo(combo, lastPlayedTiles) <= 0) continue; // 강해야만 통과
      }

      results.push(combo);
      used.add(key);
    }
  }

  return results;
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const temp: T[] = [];

  function backtrack(start: number) {
    if (temp.length === k) {
      result.push([...temp]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      temp.push(arr[i]);
      backtrack(i + 1);
      temp.pop();
    }
  }

  backtrack(0);
  return result;
}

const shapeOrder = { cloud: 0, star: 1, moon: 2, sun: 3 } as const;

function getComboScoreArray(tiles: Tile[]): [number, number][] {
  return (tiles
    .map((t) => {
      const num = parseInt(t.match(/\d+/)?.[0] || "0", 10);
      const shape = t.match(/[a-z]+/)?.[0] as keyof typeof shapeOrder;
      const adjustedNum = num === 1 ? 16 : num === 2 ? 17 : num;
      return [adjustedNum, shapeOrder[shape]];
    })
    .sort((a, b) => {
      if (a[0] !== b[0]) return a[0] - b[0];
      return a[1] - b[1];
    });
)
}

function compareCombo(a: Tile[], b: Tile[]): number {
  const typeA = validateTiles(a);
  const typeB = validateTiles(b);
  if (!typeA || !typeB || a.length !== b.length) return 0;

  const rankA = getComboScoreArray(a);
  const rankB = getComboScoreArray(b);

  for (let i = rankA.length - 1; i >= 0; i--) {
    if (rankA[i][0] !== rankB[i][0]) return rankA[i][0] - rankB[i][0];
    if (rankA[i][1] !== rankB[i][1]) return rankA[i][1] - rankB[i][1];
  }

  return 0; // 완전히 같음
}
