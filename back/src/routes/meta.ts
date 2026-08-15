import { asc } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import {
  DESIRED_DIRECTIONS,
  EDUCATION_LEVELS,
  GENDERS,
  MARITAL_STATUSES,
  OUTCOMES,
  PROGRAM_OUTCOMES,
  PROGRAMS,
  REVIEW_STATUSES,
  STATUSES,
  UPDATE_SOURCES,
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
      programOutcomes: PROGRAM_OUTCOMES,
      genders: GENDERS,
      outcomes: OUTCOMES,
      educationLevels: EDUCATION_LEVELS,
      desiredDirections: DESIRED_DIRECTIONS,
      updateSources: UPDATE_SOURCES,
      maritalStatuses: MARITAL_STATUSES,
    };
  });
}
