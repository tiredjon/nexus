import { asc } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import {
  GENDERS,
  OUTCOMES,
  PROGRAMS,
  REVIEW_STATUSES,
  STATUSES,
} from "../db/constants.js";
import { db } from "../db/client.js";
import { mahallas } from "../db/schema.js";

// пп.4–5: справочники для фронта. Обе ручки под auth.
export async function metaRoutes(app: FastifyInstance): Promise<void> {
  app.get("/meta/mahallas", { preHandler: [app.authenticate] }, async () => {
    return db
      .select({
        id: mahallas.id,
        name: mahallas.name,
        lat: mahallas.lat,
        lng: mahallas.lng,
      })
      .from(mahallas)
      .orderBy(asc(mahallas.id));
  });

  app.get("/meta/dictionaries", { preHandler: [app.authenticate] }, async () => {
    return {
      statuses: STATUSES,
      reviewStatuses: REVIEW_STATUSES,
      programs: PROGRAMS,
      genders: GENDERS,
      outcomes: OUTCOMES,
    };
  });
}
