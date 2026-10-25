import type { CharacterSummary } from "../types";

/**
 * DEV ONLY. Made-up characters for walking the list with no back end (see api/fakeCharactersApi.ts).
 * Names, art and identity lines come from the Claude Design v2 sample set; none of them is D&D.
 */
export const FAKE_CHARACTERS: CharacterSummary[] = [
  {
    id: "fake-brakka",
    name: "Brakka Stoneveil",
    imageUrl: "/images/characters/imagechar3.png",
    subtitle: "Ironhold · Shieldbreaker",
    status: "ACTIVE",
    favorite: true,
    updatedAt: "2026-10-25T12:00:00.000Z",
  },
  {
    id: "fake-rafa",
    name: "Rafa Delgado",
    imageUrl: "/images/charles_lourance.png",
    subtitle: "Getaway driver",
    status: "ACTIVE",
    favorite: false,
    updatedAt: "2026-10-24T12:00:00.000Z",
  },
  {
    id: "fake-wren",
    name: "Wren",
    imageUrl: "/images/characters/imagechar2.png",
    subtitle: "Wandering cartographer. Owes the Guild a map of the drowned coast.",
    status: "ACTIVE",
    favorite: false,
    updatedAt: "2026-10-23T12:00:00.000Z",
  },
  {
    id: "fake-sorrel",
    name: "Sorrel Vane",
    imageUrl: null,
    subtitle: "Hexwright",
    status: "ARCHIVED",
    favorite: false,
    updatedAt: "2026-10-20T12:00:00.000Z",
  },
];
