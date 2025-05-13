export type Tile = string; // 예: "🌕3", "🌞14"

function getShape(tile: Tile): string {
  return tile[0]; // 이모지 모양만 추출
}

function getNumber(tile: Tile): number {
  return parseInt(tile.slice(1), 10); // 숫자만 추출
}

export function validateTiles(tiles: Tile[]): string | null {
  if (tiles.length === 0) return null;

  const numbers = tiles.map(getNumber).sort((a, b) => a - b);
  const shapes = tiles.map(getShape);

  const allSameNumber = numbers.every((n) => n === numbers[0]);
  const allSameShape = shapes.every((s) => s === shapes[0]);
  const isStraight = numbers.every((n, i, arr) => (i === 0 ? true : n === arr[i - 1] + 1));

  // 족보 판단
  if (tiles.length === 1) {
    return "싱글";
  }

  if (tiles.length === 2 && allSameNumber) {
    return "페어";
  }

  if (tiles.length === 3 && allSameNumber) {
    return "트리플";
  }

  if (tiles.length === 5 && isStraight && allSameShape) {
    return "스트레이트 플러쉬";
  }

  if (tiles.length === 5 && isStraight) {
    return "스트레이트";
  }

  if (tiles.length === 5 && allSameShape) {
    return "플러쉬";
  }

  // 유효한 족보가 아님
  return null;
}
