const shapes = ["cloud", "sun", "moon", "star"];
const numbers = Array.from({ length: 15 }, (_, i) => i + 1); // 1 ~ 15

export function generateAllTiles(): string[] {
  const tiles: string[] = [];
  for (const shape of shapes) {
    for (const number of numbers) {
      tiles.push(`${shape}${number}`);
    }
  }
  return tiles;
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
