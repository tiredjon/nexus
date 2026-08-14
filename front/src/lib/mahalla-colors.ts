import { MAHALLAS, type Mahalla } from "@/lib/data";
import { mahallaNeighbors } from "@/lib/mahallaVoronoi";

/** Режим раскраски территорий на карте района. */
export type ZoneColorMode = "neet" | "mahalla";

/**
 * Категориальная палитра: по одному насыщенному цвету на махаллю.
 *
 * Порядок в массиве ни за кем не закреплён — цвета разбираются жадно по графу
 * смежности зон (см. assignPalette), чтобы соседние на карте территории
 * получили заведомо далёкие друг от друга оттенки.
 */
export const MAHALLA_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#dc2626", // red
  "#ea580c", // orange
  "#d97706", // amber
  "#65a30d", // lime
  "#16a34a", // emerald
  "#0d9488", // teal
  "#0891b2", // cyan
  "#4f46e5", // indigo
  "#c026d3", // fuchsia
] as const;

const FALLBACK_COLOR = MAHALLA_COLORS[0];

function channelsOf(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) return null;

  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/**
 * Расстояние между цветами по «redmean» — дешёвое приближение к тому, насколько
 * два оттенка различает глаз. Точнее евклидова расстояния в RGB и не тянет
 * перевод в Lab ради дюжины сравнений.
 */
function colorDistance(a: string, b: string): number {
  const first = channelsOf(a);
  const second = channelsOf(b);
  if (!first || !second) return 0;

  const [r1, g1, b1] = first;
  const [r2, g2, b2] = second;
  const rMean = (r1 + r2) / 2;
  const [dr, dg, db] = [r1 - r2, g1 - g2, b1 - b2];

  return Math.sqrt(
    (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db,
  );
}

/**
 * Раздаёт палитру так, чтобы соседним зонам достались далёкие оттенки.
 *
 * Классическая раскраска графа тут не подходит: она бы обошлась 4–5 цветами на
 * 12 махаллей, и в легенде цвета начали бы повторяться. Поэтому каждый цвет
 * уходит ровно одной махалле, а выбор идёт жадно: сначала самые «зажатые» зоны
 * (больше всего соседей — меньше свободы), и каждой достаётся тот из
 * оставшихся цветов, который максимально далёк от уже занятых соседями.
 */
function assignPalette(): Map<Mahalla, string> {
  const neighbors = mahallaNeighbors(MAHALLAS);
  const assigned = new Map<Mahalla, string>();
  const free: string[] = [...MAHALLA_COLORS];

  const order = [...MAHALLAS].sort(
    (a, b) => (neighbors.get(b)?.length ?? 0) - (neighbors.get(a)?.length ?? 0),
  );

  for (const mahalla of order) {
    // Махаллей больше, чем красок, — начинаем палитру заново.
    if (free.length === 0) free.push(...MAHALLA_COLORS);

    const taken = (neighbors.get(mahalla) ?? [])
      .map((neighbor) => assigned.get(neighbor))
      .filter((color): color is string => Boolean(color));

    let bestIndex = 0;
    let bestScore = -Infinity;
    free.forEach((color, index) => {
      const score = taken.length
        ? Math.min(...taken.map((used) => colorDistance(color, used)))
        : 0;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    assigned.set(mahalla, free.splice(bestIndex, 1)[0] ?? FALLBACK_COLOR);
  }

  return assigned;
}

// Раскладка считается один раз: она зависит только от геометрии зон, а та
// строится из констант. Лениво — чтобы импорт модуля (например, ради легенды)
// не тянул за собой построение диаграммы Вороного раньше времени.
let paletteByMahalla: Map<Mahalla, string> | null = null;

/**
 * Цвет закреплён за махаллёй, а не за позицией в переданном списке: он один
 * и тот же между рендерами и не зависит от того, сколько махаллей видит
 * текущая роль (инспектор махалли получит тот же цвет, что и в общем списке
 * района).
 */
export function mahallaColor(mahalla: Mahalla): string {
  paletteByMahalla ??= assignPalette();
  return paletteByMahalla.get(mahalla) ?? FALLBACK_COLOR;
}

/** Затемнение hex-цвета — контур зоны рисуем той же краской, но насыщеннее. */
export function darken(hex: string, amount = 0.15): string {
  const channels = channelsOf(hex);
  if (!channels) return hex;

  return `#${channels
    .map((channel) =>
      Math.round(channel * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
