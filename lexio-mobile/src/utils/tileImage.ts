// 실제 경로 생성 함수
export function getTileImagePath(tile: string): string {
  const shape = tile.match(/[a-zA-Z]+/)?.[0];
  const number = tile.match(/\d+/)?.[0];
  console.log(tile);

  if (!shape || !number) {
    return "/assets/fallback.png"; // 오류 시 대체 이미지
  }

  return `/assets/tiles/${shape}${number}.png`;
}
