// src/components/RecommendationPanel.tsx

import type { Tile } from "../utils/validateTiles";
import { getTileImagePath } from "../utils/tileImage";
import { getValidSingles, getValidPairs, getValidTriples, getValidFives } from "../utils/recommendationUtils";
import { validateTiles } from "../utils/validateTiles";

interface RecommendationPanelProps {
  myTiles: Tile[];
  onSelect: (tiles: Tile[]) => void;
  lastPlayedTiles?: Tile[];
}

export function RecommendationPanel({ myTiles, onSelect, lastPlayedTiles }: RecommendationPanelProps) {
  const recommendations = getAllValidCombinations(myTiles, lastPlayedTiles);

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
                {combo
                  .slice()
                  .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
                    const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
                    return numA - numB;
                  })
                  .map((tile, i) => (
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

function getAllValidCombinations(myTiles: Tile[], lastPlayedTiles?: Tile[]): Tile[][] {
  const type = validateTiles(lastPlayedTiles || []);

  switch (type) {
    case "single":
      return getValidSingles(myTiles, lastPlayedTiles);
    case "pair":
      return getValidPairs(myTiles, lastPlayedTiles);
    case "triple":
      return getValidTriples(myTiles, lastPlayedTiles);
    case "straight":
    case "flush":
    case "fullhouse":
    case "fourcard":
    case "straightflush":
      return getValidFives(myTiles, lastPlayedTiles);
    default:
      return [
        ...getValidSingles(myTiles),
        ...getValidPairs(myTiles),
        ...getValidTriples(myTiles),
        ...getValidFives(myTiles),
      ];
  }
}
