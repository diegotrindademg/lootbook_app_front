/** The status values the back end knows (backend/prisma/schema.prisma, CharacterStatus). */
export type CharacterStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

/** One card on the character screen. */
export type CharacterSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  /**
   * The identity line under the name. The back end has no system-agnostic source for it yet
   * (the sheet's blocks are not stored), so cards from the real list have none.
   */
  subtitle: string | null;
  status: CharacterStatus;
  favorite: boolean;
  /** ISO date; the Recent view sorts on it. */
  updatedAt: string;
};

export type CharacterListTab = "Recent" | "Favorites" | "Archived";
