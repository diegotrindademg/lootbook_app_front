"use client";

import { useCallback, useEffect, useState } from "react";
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

  return { status, characters, setCharacters, reload };
}
