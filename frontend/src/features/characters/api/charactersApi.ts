import { DEV_FAKES_ENABLED } from "@/shared/config/devFakes";
import type { CharacterSummary } from "../types";
import { fakeCharactersApi } from "./fakeCharactersApi";
import { httpCharactersApi } from "./httpCharactersApi";

/** What the character screen needs from the back end. The screen only imports `charactersApi`. */
export interface CharactersApi {
  list(): Promise<CharacterSummary[]>;
  rename(id: string, name: string): Promise<CharacterSummary>;
  archive(id: string): Promise<CharacterSummary>;
  unarchive(id: string): Promise<CharacterSummary>;
  remove(id: string): Promise<void>;
  /** POST /characters/:id/duplicate, a new route (favorite-duplicate.md 3.2). Resolves with the copy. */
  duplicate(source: CharacterSummary): Promise<CharacterSummary>;
  /** PATCH /characters/:id with the new isFavorite field (favorite-duplicate.md 3.1). */
  setFavorite(id: string, favorite: boolean): Promise<CharacterSummary>;
}

export const charactersApi: CharactersApi = DEV_FAKES_ENABLED ? fakeCharactersApi : httpCharactersApi;
