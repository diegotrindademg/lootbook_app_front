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
  /** No endpoint yet. */
  duplicate(source: CharacterSummary): Promise<CharacterSummary>;
  /** No endpoint yet. */
  setFavorite(id: string, favorite: boolean): Promise<void>;
}

export const charactersApi: CharactersApi = DEV_FAKES_ENABLED ? fakeCharactersApi : httpCharactersApi;
