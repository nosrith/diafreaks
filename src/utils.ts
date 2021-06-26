export function getTimeText(time: number, forceSec?: boolean): string {
  const hStr = `${Math.floor(time / 3600)}`;
  const mmStr = `${Math.floor(time / 60) % 60}`.padStart(2, "0");
  const ssStr = `${time % 60}`.padStart(2, "0");
  return time % 60 != 0 || forceSec
    ? `${hStr}:${mmStr}:${ssStr}`
    : `${hStr}:${mmStr}`;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
export function getTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number
): number {
  if (!ctx) return 0;
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}
