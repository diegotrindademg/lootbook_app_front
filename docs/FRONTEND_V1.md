# LootBook v1.0, the front end (for Kerley)

**Resumo (PT):** O front end da v1.0 (lista, login, editor, ficha, Configurações, busca, estados offline e de erro, telefone e tela larga) roda com dados falsos (`NEXT_PUBLIC_LOOTBOOK_FAKE=1`) até as suas rotas existirem; este arquivo diz como rodar, cada chave `?fake=`, onde cada coisa mora e o que cada chamada espera do back end.
**Resumo (PT):** Tudo que espera por você está marcado `TODO(Kerley)` com a spec e a linha; o login com Supabase é um RASCUNHO testado só com mock e precisa do seu OK; esta pull request deve entrar antes das specs 6 (2.2 a 2.8) e 7 (2.3).

Branch `v1-close-out` of `diegotrindademg/lootbook_app_front`, from `v1-slice-3`. Base: your `main` at
`2645714`. Nothing under `backend/` changes. The design truth is Figma file `cRD8blrS4BIIQ01JC4GuTN`,
page "0 - Start here" ([open](https://www.figma.com/design/cRD8blrS4BIIQ01JC4GuTN/?node-id=2446-4207)).
Your seven specs live in Diego's LootBook folder, `Tasks/Dev/kerley-specs/` (README first).

---

## 1. Run it

```bash
cd frontend
npm ci
echo NEXT_PUBLIC_LOOTBOOK_FAKE=1 > .env.development.local
npm run dev            # http://localhost:3000
npm test               # unit tests (vitest), the Supabase draft
npm run lint
npm run build          # a production build never uses the fakes
```

| Variable | Where | What it does |
|---|---|---|
| `NEXT_PUBLIC_LOOTBOOK_FAKE` | `frontend/.env.development.local` | `1` turns on the fakes in `next dev` only. `next build` ignores it. |
| `LOOTBOOK_API_URL` | server env of the Next app | Where `/api/lootbook/*` is proxied (`next.config.ts`). Default `http://localhost:3333`. |
| `NEXT_PUBLIC_SUPABASE_URL` | build env | With the next one, turns on the Supabase sign-in draft (section 6). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build env | The project's anon (public) key. Never the service key. |

Without the fakes and without the Supabase variables, sign-in answers "Sign-in is not connected yet" and
the list is read without a token (your dev back end answers as its guest user).

## 2. The fakes, and how to reach every state

All fakes are in the browser tab (localStorage and sessionStorage), never on a server, and only in
`next dev` with `NEXT_PUBLIC_LOOTBOOK_FAKE=1` (`shared/config/devFakes.ts`).

**Sign-in** (`features/auth/api/fakeAuthClient.ts`):

| Do | You see |
|---|---|
| Password `wrong` | "That password does not match" |
| An email starting with `nobody` | "No account for that email" |
| Create account with an email starting with `taken` | "That email already has an account" |
| An email starting with `empty` | Signed in, no characters (the empty list with the sample card) |
| `/set-new-password?expired=1` | "That link has expired" |
| Anything else | Signed in, four fake characters |

**Sheets** (`features/sheet/api/fakeSheetApi.ts`): a character named `Offline...` fails its first save
(Retry works); `Stale...` gets a conflict (409) on its first save; a resource block titled `Flaky...` fails
every change.

**The `?fake=` switches**, on any address, kept for the tab until another `?fake=` (an empty one clears
them). Several at once with commas: `?fake=fail-sheet,slow`.

| Switch | What fails |
|---|---|
| `offline` | Every fake call, as with no network; the offline bar shows. Signing out still works. |
| `fail-list` | Reading the character list, as offline |
| `fail-sheet` | Opening a sheet, as offline |
| `fail-save` | Saving in the editor, as offline (the draft stays on the device) |
| `fail-play` | A change at the table (spend, reset), as offline |
| `fail-signin` | Every sign-in call, as offline |
| `fail-list-server` | The list read, as a server error (500), online |
| `fail-sheet-server` | The sheet read, as a server error (500), online |
| `slow` | Every fake call takes four times as long, to see loading states |

## 3. The map

Rules: `docs/ARCHITECTURE_RULES.md` (app routes, features own their code, shared only when shared).
That file still uses the removed builder (`character-builder`, `usePointBuy`...) as its examples; it is
yours, so this pull request leaves it as it is.

| Route (`src/app`) | Screen |
|---|---|
| `/` | Character list: splash, loading, empty with the sample card, Recent, Favorites, Archived, search |
| `/sign-in`, `/create-account`, `/check-email`, `/reset-password`, `/reset-link-sent`, `/set-new-password` | The sign-in screens |
| `/characters/create` | The editor for a new character (a draft on the device until Save) |
| `/characters/[id]` | The character sheet (play) |
| `/characters/[id]/edit` | The editor |
| `/characters/sample` | The read-only sample sheet |
| `/settings` | Account (email, Sign out) and the app version |
| `/equipments` | "Equipment is on its way" (v1.0); Create starts a character, Search opens Characters with search focused |
| `/equipments/create` | Redirects to `/characters/create` |

`frontend/app/` holds one-line re-exports of `src/app` (Next gives a root `app/` precedence). Your tidy-up
spec 7, item 2.3, deletes it; that still works after this pull request (section 7).

| Folder (`src`) | Holds |
|---|---|
| `features/auth` | Sign-in screens, `AuthSessionContext`, the `AuthClient` seam (fake, not connected, Supabase draft) |
| `features/characters` | The list, cards, card menu, search, splash; the `CharactersApi` seam |
| `features/sheet` | Editor, block library, block configuration, the sheet, play; the `SheetApi` seam, the draft on the device |
| `features/settings` | Settings |
| `features/equipments` | The v1.0 Equipments tab: the quiet empty card and one line (Figma page 1, Flow 16) |
| `shared` | `lootbookRequest` (every back end call, adds the token), tab bar, nav bar, overlays, offline bar, icons |

**The three seams.** Each screen imports one object, and that object is the fake or the real adapter:

| Seam | Interface | Real adapter | Fake |
|---|---|---|---|
| Sign-in | `features/auth/api/authClient.ts` | `supabaseAuthClient.ts` (draft) | `fakeAuthClient.ts` |
| Characters | `features/characters/api/charactersApi.ts` | `httpCharactersApi.ts` | `fakeCharactersApi.ts` |
| Sheet | `features/sheet/api/sheetApi.ts` | `httpSheetApi.ts` | `fakeSheetApi.ts` |

When your routes land, only the real adapters change.

## 4. Every TODO(Kerley)

`grep -rn "TODO(Kerley)" frontend/src` prints these nine (paths under `frontend/src/`):

| File and line | Waits on |
|---|---|
| `features/auth/api/authClient.ts:56` | Your OK on the Supabase draft, and the project URL and anon key (section 6) |
| `features/characters/api/httpCharactersApi.ts:66` | `POST /characters/:id/duplicate`, favorite-duplicate.md 3.2 |
| `features/characters/api/httpCharactersApi.ts:74` | `isFavorite` on `PATCH /characters/:id`, favorite-duplicate.md 3.1 |
| `features/sheet/api/httpSheetApi.ts:116` | `document`, `revision` on `GET /sheet` (sheet-document.md 3.2); `derivedValues` (derived-values.md 4) |
| `features/sheet/api/httpSheetApi.ts:136` | `PUT /characters/:id/sheet-document` with the content in one call (sheet-document.md 3.1, 3.3) |
| `features/sheet/api/httpSheetApi.ts:165` | `POST /characters` with the document and content (sheet-document.md 3.3) |
| `features/sheet/api/httpSheetApi.ts:182` | `PATCH /characters/:id/resources/:key` (one-value-write.md 3) |
| `features/sheet/types.ts:220` | A list-level `trainable` field in the document; sheet-document.md 2.2 has only `trained` per row |
| `features/sheet/components/config/ChoiceConfig.tsx:139` | Where option art files are stored (v1.1, no spec yet) |

Level as a stat (spec 3) has no marker: the front end never reads `character.level`.

## 5. What the front end expects from each endpoint

Every call goes to `/api/lootbook/...` on the Next origin, proxied to `LOOTBOOK_API_URL`, with
`Authorization: Bearer <token>` when signed in and `Content-Type: application/json` when there is a body.
A failed request that never reached you is read as offline; any other non-2xx as "something went wrong
on our side". The error body is read only for `details` (shape: `backend/docs/error-contract.md`).

| Call | Sends | Reads | Spec |
|---|---|---|---|
| `GET /characters` | | `{ characters: [{ id, name, status, portraitUrl, summaryJson, isFavorite?, updatedAt }] }`; the card line is `summaryJson.card.subtitle` | existing; sheet-document.md 2.5 |
| `PATCH /characters/:id` | `{ name }`, `{ status: "ARCHIVED" \| "ACTIVE" }` or `{ isFavorite }` | `{ character }` | existing; favorite-duplicate.md 3.1 |
| `DELETE /characters/:id` | | 204 | existing |
| `POST /characters/:id/duplicate` | `{}` (always a body) | `{ character }`, 201 | favorite-duplicate.md 3.2 |
| `GET /characters/:id/sheet` | | `{ sheet: { character, stats, resources, notes, links, document, revision, derivedValues } }`; the last three optional until spec 1 and 2 | sheet-document.md 3.2; derived-values.md 4 |
| `PUT /characters/:id/sheet-document` | `{ baseRevision, document, summaryJson, stats, resources, notes }` | `{ revision }`; 409 with `details.currentRevision` | sheet-document.md 3.1, 3.3 |
| `POST /characters` | `{ name, document, summaryJson, stats, resources, notes }` | `{ character: { id } }` | sheet-document.md 3.3 |
| `GET /characters/:id/links` | | `{ links }`; the front end keeps `SET_FROM_STAT` links from `STAT` to `DERIVED` | existing; derived-values.md 8 |
| `POST /characters/:id/links`, `DELETE /characters/:id/links/:linkId` | `{ source, target, operation: "SET_FROM_STAT", configJson: { multiplier, offset, rounding } }` | | existing; derived-values.md 2.2 |
| `PATCH /characters/:id/resources/:key` | `{ adjust: n }` or `{ set, expectedCurrent }`; key encoded | `{ resource: { currentValue, maxValue }, clamped }`; 409 with `details.currentValue` | one-value-write.md 3, 3.1 |

A changed name on save goes through `PATCH /characters/:id` after the document. A changed formula is
deleted and created again (there is no PATCH for a link). An `adjust` is never retried by the front end.

## 6. Sign-in with Supabase (DRAFT, needs your OK)

`features/auth/api/supabaseAuthClient.ts` implements `AuthClient` on `@supabase/supabase-js` v2
(2.118). `authClient.ts` picks it when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
are both set; the fake still wins in `next dev` with `NEXT_PUBLIC_LOOTBOOK_FAKE=1`; otherwise "not
connected", as before. supabase-js loads on the first sign-in call (`deferredAuthClient.ts`), and a
build without the two variables never downloads it: First Load JS stays about 133 kB either way. It was
tested only against a mocked supabase-js (`supabaseAuthClient.test.ts`, `authClient.test.ts`,
`deferredAuthClient.test.ts`, 35 tests): no project, no keys, no network. It has never talked to a real
Supabase.

| AuthClient | supabase-js |
|---|---|
| `signIn` | `auth.signInWithPassword({ email, password })` |
| `signUp` | `auth.signUp({ email, password, options: { emailRedirectTo: "<site>/" } })` |
| `resendConfirmation` | `auth.resend({ type: "signup", email, options: { emailRedirectTo } })` |
| `signInWithProvider` | `auth.signInWithOAuth({ provider, options: { redirectTo: "<site>/" } })`; the page leaves, returns null |
| `resetPassword` | `auth.resetPasswordForEmail(email, { redirectTo: "<site>/set-new-password" })` |
| `checkResetLink` | "expired" when the address carries `error` or `error_code`, else whether `auth.getSession()` has the recovery session |
| `setNewPassword` | `auth.updateUser({ password })` |
| `signOut` | `auth.signOut({ scope: "local" })`, this device only, never fails (supabase-js forgets the session even offline) |
| `currentUser`, `getAccessToken` | `auth.getSession()`; null on any error |
| `onChange` | `auth.onAuthStateChange`, every event except `TOKEN_REFRESHED` |

Errors, as `AuthError` codes: `invalid_credentials` to "wrong-password"; `user_not_found` to
"no-account"; `email_exists`, `user_already_exists`, the message "User already registered", or a sign-up
user with no identities (what Supabase returns for an existing email with "Confirm email" on) to
"email-taken"; `otp_expired`, `flow_state_expired`, `flow_state_not_found` and a missing session on
`updateUser` to "link-expired"; a failed fetch to "network"; anything else to "unknown".

**For you to decide or set up:**

1. The Supabase project: email and password with "Confirm email" on; Google and Apple in their consoles;
   the email templates; redirect URLs allowed for `<site>/` and `<site>/set-new-password`.
2. Supabase answers a wrong password and an unknown email with the same `invalid_credentials`, so "No
   account for that email" never shows with this client. Keep it that way (it hides who has an account),
   or say so and the screen changes.
3. `email_not_confirmed`, the rate limits and `weak_password` map to "unknown", which the screens show
   as "Could not reach the sign-in service". Each needs its own words from design if it should say more.
4. `signOut` is this device only (`scope: "local"`); `"global"` would sign out every device.
5. The reset link uses the default (implicit) flow: the session arrives in the address and supabase-js
   reads it as it starts. If you prefer PKCE, `checkResetLink` stays the same, the email template changes.
6. The back end must accept the Supabase access token this client sends.

## 7. Merge order: this pull request first

This pull request deletes the old D&D five-step builder (`/characters/new/*`, `features/character-builder`,
its data) and the pre-slice home (`features/home`), with what only they used: `shared/components/layout/Header`,
`BottomNav`, seven icons, the builder's images (`raceImages/fighter.png` stays, the fake sheet uses it),
`src/app/components/css/AttributeScore.module.css`, and the `framer-motion`, `embla-carousel-react` and
`react-icons` packages.

Your **colour-fix spec, items 2.2 to 2.8**, and **tidy-up spec, item 2.3**, edit or delete files this pull
request deletes. Merge this first, then apply what is left of those two specs, checking that each file
still exists:

- colour-fix 2.2 to 2.8: nothing left to do, the files are gone. Item 2.1 (`tailwind.config.js`, the
  `primary` colour) is still valid, though nothing uses `primary` any more.
- tidy-up 2.3 (delete `frontend/app/`): still right; the re-exports this branch added are covered by
  `src/app` the same way (built here without it: 15 pages). Item 2.4 (`src/app/components/`) is already done here.

Left alone on purpose, not used by anything, for your tidy-up: `public/{file,globe,next,vercel,window}.svg`
(the Next template), `src/icons/setingsIcon.png`, the two zips and `todo.md` at the root.

## 8. Not in v1.0

- **Equipment.** The Equipments tab says "Equipment is on its way" and that a List block can track gear
  until then; Create on that tab starts a character. Equipment is v1.1 (M4).
- **Option art from the device.** An option's art is an image link for now (`ChoiceConfig.tsx:139`).
- **Ticking "trained" at the table.** Trained is set in the editor; the one-value write covers resources
  only, so a write for it is still to design.
- Accent themes; "tap a number, see what built it"; an offline queue (a failed save keeps the draft on the
  device, nothing is sent later by itself).
