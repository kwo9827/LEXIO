// 타입 정의
export type Tile = string; // 예: "cloud3", "moon15"

// 모양 추출 (예: cloud)
function getShape(tile: Tile): string {
  return tile.match(/[a-zA-Z]+/)?.[0] || "";
}

// 숫자 추출 (예: 3)
function getNumber(tile: Tile): number {
  const match = tile.match(/\d+/);
  if (!match) throw new Error(`잘못된 타일 형식: ${tile}`);
  const num = parseInt(match[0], 10);
  if (num < 1 || num > 15) throw new Error(`허용되지 않는 숫자: ${tile}`);
  return num;
}

// 타일 조합 검증
export function validateTiles(tiles: Tile[]): string | null {
  if (tiles.length === 0) return null;

  const numbers = tiles.map(getNumber);
  const shapes = tiles.map(getShape);

  const adjustedNums = numbers.map((n) => (n === 1 ? 16 : n === 2 ? 17 : n)).sort((a, b) => a - b);

  const allSameNumber = numbers.every((n) => n === numbers[0]);
  const allSameShape = shapes.every((s) => s === shapes[0]);

  const isSequential = (arr: number[]): boolean => arr.every((n, i, a) => i === 0 || n === a[i - 1] + 1);

  // 스트레이트 판단 (렉시오 특유 순서 고려)
  const isStraight = (() => {
    const originalSorted = numbers.slice().sort((a, b) => {
      const an = a === 1 ? 16 : a === 2 ? 17 : a;
      const bn = b === 1 ? 16 : b === 2 ? 17 : b;
      return an - bn;
    });

    const adjustedSorted = adjustedNums.slice().sort((a, b) => a - b);
    const restoredSorted = adjustedSorted.map((n) => (n === 16 ? 1 : n === 17 ? 2 : n));

    return [adjustedSorted, restoredSorted, originalSorted].some(isSequential);
  })();

  // 숫자 빈도 분석
  const numberCount: Record<number, number> = {};
  numbers.forEach((n) => {
    numberCount[n] = (numberCount[n] || 0) + 1;
  });

  const countValues = Object.values(numberCount).sort((a, b) => b - a);

  // 족보 판별
  if (tiles.length === 1) return "single";
  if (tiles.length === 2 && allSameNumber) return "pair";
  if (tiles.length === 3 && allSameNumber) return "triple";
  if (tiles.length === 5) {
    if (countValues[0] === 4) return "fourcard";
    if (countValues[0] === 3 && countValues[1] === 2) return "fullhouse";
    if (isStraight && allSameShape) return "straightflush";
    if (allSameShape) return "flush";
    if (isStraight) return "straight";
  }

  return null;
}
