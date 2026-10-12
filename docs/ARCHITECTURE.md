# Basket Run architecture

A single static page: `index.html` holds the fixed shell (header, three tab panels, footer, confirm dialog, toast), `styles.css` holds all styling, and `app.js` is one classic script wrapped in an IIFE. There is no build step and nothing is fetched.

## State and storage

Everything lives in one `state` object:

- `items`: `[{ id, name, qty, cat, checked, addedAt }]`, the shopping list.
- `staples`: `[{ id, name, qty, cat }]`.
- `dinners`: `[{ id, name, ingredients: [{ id, name, qty, category }] }]`. Ingredients use `category` rather than `cat`. `editRow` handles both through its `catKey`.
- `plan`: `{ weekStart: 'mon'|'sun', days: { mon…sun: dinnerId|null }, addedDays: { day: dinnerId } }`. A day counts as "added" only while `addedDays[day]` equals its current dinner id, so changing a day's dinner resets the state automatically.
- UI-only fields that are not persisted: `tab`, `editing` (`{ kind: 'item'|'staple'|'ing', id }`, with one editor open at a time) and `openDinner`.

`store.get` and `store.set` wrap localStorage in try/catch. `get` returns the default when a key is missing, unparsable or storage is blocked. The keys are `br.items`, `br.staples`, `br.basketOpen`, `br.theme`, `br.dinners` and `br.plan`. On load, `cleanList`, `cleanDinners` and `cleanPlan` validate everything. `cleanPlan` drops day references to unknown dinner ids. Loading never writes. `save()` writes all data keys and runs only after a user action.

## Rendering

The app re-renders the whole view on every change. Handlers mutate `state`, call `save()`, then `render()`. `render()` rebuilds the list, staples and dinners panels with the `el()` helper, so all text goes through `textContent` and never through `innerHTML`. It then updates the tab counts and calls `updateTitle()`, the single derivation of `document.title` from unchecked items. Because every list mutation goes through `render()`, the title cannot drift.

Focus survives re-renders through `data-key` attributes. `render()` refocuses either `focusKey`, when a handler set one, or the `data-key` of the element that had focus. Live form hints (quick add, add ingredient) update text directly on `input` and never re-render, so typing is never interrupted.

## Main pieces of app.js

- **Categories**: `guessCat` uses keyword regexes, with phrase overrides checked first.
- **Matching**: `normaliseName` and `same`, the one matcher for duplicates, staples "On list" and dinner merging. It lowercases, collapses spaces and strips a trailing `s` or `es` only when the stem is longer than 3 letters.
- **Parsing**: `parseQuick` reads a leading quantity and a unit (`500 g beef` becomes `beef (g)` ×500).
- **List operations**: `addItem` merges into an unchecked match, restores a checked match, or creates a new item. It returns `{ kind }`. Also here: `toggleCheck`, `deleteItem`, `clearBasket` and `editRow`.
- **Staples**: `addStapleToList` skips anything already on the list.
- **Dinners**: `dayCard`, `dinnerEditor`, `renderDinners`, `addDays` (tallies `added`, `merged` and `restored` for `summary()`), `addDay`, `duplicateDinner` and `deleteDinner`.
- **Feedback**: `askConfirm(message, okLabel, onOk)` uses the themed `<dialog>` and falls back to `window.confirm`. `toast` writes to an `aria-live` status region.
- **Other**: theme handling, tabs, and export/
