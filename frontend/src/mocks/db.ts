import { buildSeed, emptySeed, type MockDb } from "./seed";
import { getScenario } from "./scenario";

/**
 * In-memory demo store. Lives only for the current page session — a reload
 * restores the seed. Nothing here is persisted or sent to a server.
 */
let db: MockDb | null = null;

export function mockDb(): MockDb {
  if (!db) db = getScenario() === "empty" ? emptySeed() : buildSeed();
  return db;
}

export function resetMockDb(): void {
  db = null;
}
