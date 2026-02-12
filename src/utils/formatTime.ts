/** MM:SS format for countdown timers */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** H:MM:SS or MM:SS for elapsed timers */
export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Parse "HH:MM:SS" or "MM:SS" to total seconds */
export function parseDurationToSeconds(dur: string): number {
  const parts = dur.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Parse rest string like "60s", "2min", "OFF" to seconds */
export function parseRestToSeconds(rest: string): number {
  if (!rest || rest === 'OFF') return 0;
  const minMatch = rest.match(/^(\d+)\s*min$/);
  if (minMatch) return Number(minMatch[1]) * 60;
  const secMatch = rest.match(/^(\d+)\s*s?$/);
  if (secMatch) return Number(secMatch[1]);
  return 0;
}
