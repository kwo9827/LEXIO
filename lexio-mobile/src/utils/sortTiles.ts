export function sortTilesByShapeAndNumber(tiles: string[]): string[] {
  const shapeOrder = ["cloud", "star", "moon", "sun"];

  return tiles.sort((a, b) => {
    const [aShape, aNum] = [a.replace(/\d+$/, ""), parseInt(a.match(/\d+$/)?.[0] || "0")];
    const [bShape, bNum] = [b.replace(/\d+$/, ""), parseInt(b.match(/\d+$/)?.[0] || "0")];

    const shapeDiff = shapeOrder.indexOf(aShape) - shapeOrder.indexOf(bShape);
    if (shapeDiff !== 0) return shapeDiff;
    return aNum - bNum;
  });
}
