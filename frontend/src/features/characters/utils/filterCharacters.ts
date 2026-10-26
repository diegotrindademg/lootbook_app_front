import type { CharacterListTab, CharacterSummary } from "../types";

/** Whether a card matches the search text, by name or subtitle (contract 3). Empty text matches everything. */
export function matchesSearch(card: { name: string; subtitle: string | null }, query: string) {
  const needle = query.trim().toLowerCase();
  return !needle || `${card.name}\n${card.subtitle ?? ""}`.toLowerCase().includes(needle);
}

/** The cards a list tab shows, narrowed by the search text (name and subtitle, contract 3), newest first. */
export function filterCharacters(
  characters: CharacterSummary[],
  tab: CharacterListTab,
  query: string,
): CharacterSummary[] {
  return characters
    .filter((c) => {
      const archived = c.status === "ARCHIVED";
      if (tab === "Archived") return archived;
      if (tab === "Favorites") return c.favorite && !archived;
      return !archived;
    })
    .filter((c) => matchesSearch(c, query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** What an empty tab says. Only Recent, unsearched, invites creating a character. */
export function emptyLabel(tab: CharacterListTab, query: string): string | null {
  if (query.trim()) return "No character matches";
  if (tab === "Favorites") return "No favorites yet";
  if (tab === "Archived") return "Nothing archived";
  return null;
}
