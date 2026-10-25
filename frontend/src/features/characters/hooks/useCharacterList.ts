"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { charactersApi } from "../api/charactersApi";
import type { CharacterSummary } from "../types";

export type CharacterListStatus = "loading" | "ready" | "error";

/**
 * The signed-in user's characters. Signed out there is nothing on the server to read (a draft stays
 * on the device until sign-in), so the list is simply empty. `signedIn` is null while that is unknown.
 */
export function useCharacterList(signedIn: boolean | null) {
  const [status, setStatus] = useState<CharacterListStatus>("loading");
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    setCharacters([]);
    if (signedIn === null) {
      setStatus("loading");
      return;
    }
    if (!signedIn) {
      setStatus("ready");
      return;
    }

    let active = true;
    setStatus("loading");
    charactersApi.list().then(
      (list) => {
        if (!active) return;
        setCharacters(list);
        setStatus("ready");
      },
      () => {
        if (active) setStatus("error");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn, loadCount]);

  const reload = useCallback(() => setLoadCount((count) => count + 1), []);

  // Card menu actions change the list at once and put it back if the back end says no.
  const [failure, setFailure] = useState<string | null>(null);
  const current = useRef(characters);
  current.current = characters;

  const replace = (updated: CharacterSummary) =>
    setCharacters((list) => list.map((c) => (c.id === updated.id ? updated : c)));

  async function attempt(
    change: (list: CharacterSummary[]) => CharacterSummary[],
    call: () => Promise<void>,
    failureMessage: string,
  ) {
    const before = current.current;
    setFailure(null);
    setCharacters(change(before));
    try {
      await call();
    } catch {
      setCharacters(before);
      setFailure(failureMessage);
    }
  }

  const now = () => new Date().toISOString();

  const actions = {
    rename: (character: CharacterSummary, name: string) =>
      attempt(
        (list) => list.map((c) => (c.id === character.id ? { ...c, name, updatedAt: now() } : c)),
        async () => replace(await charactersApi.rename(character.id, name)),
        `Could not rename ${character.name}`,
      ),
    archive: (character: CharacterSummary) =>
      attempt(
        (list) => list.map((c) => (c.id === character.id ? { ...c, status: "ARCHIVED" } : c)),
        async () => replace(await charactersApi.archive(character.id)),
        `Could not archive ${character.name}`,
      ),
    unarchive: (character: CharacterSummary) =>
      attempt(
        (list) =>
          list.map((c) => (c.id === character.id ? { ...c, status: "ACTIVE", updatedAt: now() } : c)),
        async () => replace(await charactersApi.unarchive(character.id)),
        `Could not unarchive ${character.name}`,
      ),
    remove: (character: CharacterSummary) =>
      attempt(
        (list) => list.filter((c) => c.id !== character.id),
        () => charactersApi.remove(character.id),
        `Could not delete ${character.name}`,
      ),
    /** Resolves with the copy, which lands first in Recent. */
    duplicate: async (character: CharacterSummary) => {
      setFailure(null);
      try {
        const copy = await charactersApi.duplicate(character);
        setCharacters((list) => [copy, ...list]);
        return copy;
      } catch {
        setFailure(`Could not duplicate ${character.name}`);
        return null;
      }
    },
  };

  return { status, characters, reload, actions, failure, clearFailure: () => setFailure(null) };
}
