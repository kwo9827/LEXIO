// 타입 정의
export type Tile = string; // 예: "cloud3", "moon15"

// 모양 추출 (예: cloud)
function getShape(tile: Tile): string {
  return tile.match(/[a-zA-Z]+/)?.[0] || "";
}

// 숫자 추출 (예: 3)
function getNumber(tile: Tile): number {
  return parseInt(tile.match(/\d+/)?.[0] || "0", 10);
}

// 타일 조합 검증
export function validateTiles(tiles: Tile[]): string | null {
  if (tiles.length === 0) return null;

  const numbers = tiles.map(getNumber).sort((a, b) => a - b);
  const shapes = tiles.map(getShape);

  const allSameNumber = numbers.every((n) => n === numbers[0]);
  const allSameShape = shapes.every((s) => s === shapes[0]);
  const isStraight = numbers.every((n, i, arr) => i === 0 || n === arr[i - 1] + 1);

  // 숫자 빈도 카운트
  const numberCount: Record<number, number> = {};
  numbers.forEach((n) => {
    numberCount[n] = (numberCount[n] || 0) + 1;
  });

  const countValues = Object.values(numberCount).sort((a, b) => b - a); // 큰 값부터

  // 족보 판단
  if (tiles.length === 1) return "싱글";
  if (tiles.length === 2 && allSameNumber) return "페어";
  if (tiles.length === 3 && allSameNumber) return "트리플";
  if (tiles.length === 5 && countValues[0] === 4) return "포카드";
  if (tiles.length === 5 && countValues[0] === 3 && countValues[1] === 2) return "풀하우스";
  if (tiles.length === 5 && isStraight && allSameShape) return "스트레이트 플러쉬";
  if (tiles.length === 5 && allSameShape) return "플러쉬";
  if (tiles.length === 5 && isStraight) return "스트레이트";

  return null; // 유효하지 않음
}
