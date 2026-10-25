import { lootbookRequest } from "@/shared/api/lootbookRequest";
import type { CharacterStatus, CharacterSummary } from "../types";
import type { CharactersApi } from "./charactersApi";

/** The character as the back end returns it (backend/src/modules/characters/schema.ts). */
type ApiCharacter = {
  id: string;
  name: string;
  status: CharacterStatus;
  portraitUrl: string | null;
  updatedAt: string;
};

type CharacterResponse = { character: ApiCharacter };
type CharacterListResponse = { characters: ApiCharacter[] };

function toSummary(character: ApiCharacter): CharacterSummary {
  return {
    id: character.id,
    name: character.name,
    imageUrl: character.portraitUrl,
    subtitle: null,
    status: character.status,
    // TODO(Kerley): favourites have no field or endpoint yet.
    favorite: false,
    updatedAt: character.updatedAt,
  };
}

function patchCharacter(id: string, body: Partial<Pick<ApiCharacter, "name" | "status">>) {
  return lootbookRequest<CharacterResponse>(`/characters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((response) => toSummary(response.character));
}

export const httpCharactersApi: CharactersApi = {
  async list() {
    const response = await lootbookRequest<CharacterListResponse>("/characters");
    return response.characters.map(toSummary);
  },
  rename: (id, name) => patchCharacter(id, { name }),
  archive: (id) => patchCharacter(id, { status: "ARCHIVED" }),
  unarchive: (id) => patchCharacter(id, { status: "ACTIVE" }),
  async remove(id) {
    await lootbookRequest<void>(`/characters/${id}`, { method: "DELETE" });
  },
  async duplicate(source) {
    // TODO(Kerley): no duplicate endpoint yet. The copy only lives on screen until one exists.
    return {
      ...source,
      id: `local-copy-${Date.now().toString(36)}`,
      name: `${source.name} copy`,
      favorite: false,
      updatedAt: new Date().toISOString(),
    };
  },
  async setFavorite() {
    // TODO(Kerley): no favourite field or endpoint yet. The heart lives on the sheet, not in this slice.
  },
};
