import type { CharacterListTab, CharacterSummary } from "../types";

/** The cards a list tab shows, narrowed by the search text (name and subtitle, contract 3), newest first. */
export function filterCharacters(
  characters: CharacterSummary[],
  tab: CharacterListTab,
  query: string,
): CharacterSummary[] {
  const needle = query.trim().toLowerCase();
  return characters
    .filter((c) => {
      const archived = c.status === "ARCHIVED";
      if (tab === "Archived") return archived;
      if (tab === "Favorites") return c.favorite && !archived;
      return !archived;
    })
    .filter((c) => !needle || `${c.name}
${c.subtitle ?? ""}`.toLowerCase().includes(needle))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** What an empty tab says. Only Recent, unsearched, invites creating a character. */
export function emptyLabel(tab: CharacterListTab, query: string): string | null {
  if (query.trim()) return "No character matches";
  if (tab === "Favorites") return "No favorites yet";
  if (tab === "Archived") return "Nothing archived";
  return null;
}
