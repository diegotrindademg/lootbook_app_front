import { lootbookRequest } from "@/shared/api/lootbookRequest";
import type { CharacterStatus, CharacterSummary } from "../types";
import type { CharactersApi } from "./charactersApi";

/**
 * The character as the back end returns it (backend/src/modules/characters/schema.ts), with the
 * fields the specs for Kerley add: `isFavorite` (favorite-duplicate.md, 2.1) and the card line in
 * `summaryJson.card.subtitle` (sheet-document.md, 2.5). Both are optional until the back end has them.
 */
type ApiCharacter = {
  id: string;
  name: string;
  status: CharacterStatus;
  portraitUrl: string | null;
  summaryJson: unknown;
  isFavorite?: boolean;
  updatedAt: string;
};

type CharacterResponse = { character: ApiCharacter };
type CharacterListResponse = { characters: ApiCharacter[] };

/** The card line, when the character carries one. Old wizard data has none. */
function cardSubtitle(summaryJson: unknown): string | null {
  if (!summaryJson || typeof summaryJson !== "object") return null;
  const card = (summaryJson as { card?: unknown }).card;
  if (!card || typeof card !== "object") return null;
  const subtitle = (card as { subtitle?: unknown }).subtitle;
  return typeof subtitle === "string" && subtitle.trim() ? subtitle : null;
}

function toSummary(character: ApiCharacter): CharacterSummary {
  return {
    id: character.id,
    name: character.name,
    imageUrl: character.portraitUrl,
    subtitle: cardSubtitle(character.summaryJson),
    status: character.status,
    favorite: character.isFavorite ?? false,
    updatedAt: character.updatedAt,
  };
}

function patchCharacter(
  id: string,
  body: Partial<Pick<ApiCharacter, "name" | "status" | "isFavorite">>,
) {
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
    // TODO(Kerley): new route, favorite-duplicate.md 3.2. The body must be sent, even empty:
    // Fastify answers 400 to a JSON request with no body.
    const response = await lootbookRequest<CharacterResponse>(`/characters/${source.id}/duplicate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return toSummary(response.character);
  },
  // TODO(Kerley): new field on the existing PATCH, favorite-duplicate.md 3.1.
  setFavorite: (id, favorite) => patchCharacter(id, { isFavorite: favorite }),
};
