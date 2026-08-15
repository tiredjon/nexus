import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/client.js";
import { mahallas } from "../src/db/schema.js";

// Сидер v1 (S1): только upsert 12 махаллей. Людская часть (generatePeople)
// приезжает в S2. id = позиция в MAHALLAS + 1, координаты из backend.md §6.
const MAHALLA_SEED: { id: number; name: string; lat: number; lng: number }[] = [
  { id: 1, name: "Дархан", lat: 41.3455, lng: 69.3105 },
  { id: 2, name: "Буюк Ипак Йули", lat: 41.3282, lng: 69.3208 },
  { id: 3, name: "Олтинтепа", lat: 41.3521, lng: 69.3402 },
  { id: 4, name: "Элобод", lat: 41.3388, lng: 69.3555 },
  { id: 5, name: "Гулзор", lat: 41.3215, lng: 69.3465 },
  { id: 6, name: "Мингбулок", lat: 41.3608, lng: 69.3255 },
  { id: 7, name: "Юзработ", lat: 41.3172, lng: 69.3302 },
  { id: 8, name: "Козиробод", lat: 41.3345, lng: 69.3712 },
  { id: 9, name: "Мустакиллик", lat: 41.3492, lng: 69.3628 },
  { id: 10, name: "Бахор", lat: 41.3105, lng: 69.3585 },
  { id: 11, name: "Салар", lat: 41.3268, lng: 69.3021 },
  { id: 12, name: "Шахрисабз", lat: 41.3572, lng: 69.3495 },
];

async function main(): Promise<void> {
  for (const m of MAHALLA_SEED) {
    await db
      .insert(mahallas)
      .values(m)
      .onConflictDoUpdate({
        target: mahallas.id,
        set: { name: m.name, lat: m.lat, lng: m.lng },
      });
  }
  const [{ count }] = (
    await db.execute<{ count: number }>(
      sql`SELECT count(*)::int AS count FROM mahallas`,
    )
  ).rows;
  console.log(`Засеяно махаллей: ${count}`);
}

await main();
await pool.end();
