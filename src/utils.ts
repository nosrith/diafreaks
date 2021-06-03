export function getTimeText(time: number, forceSec?: boolean): string {
    const hStr = `${Math.floor(time / 3600)}`;
    const mmStr = `${Math.floor(time / 60) % 60}`.padStart(2, "0");
    const ssStr = `${time % 60}`.padStart(2, "0");
    return time % 60 != 0 || forceSec ? `${hStr}:${mmStr}:${ssStr}` : `${hStr}:${mmStr}`;
}
