# Basket Run

One household grocery list, kept on the device you shop with. Quick-add items, check them off as they go into the cart, re-add your weekly staples in a tap, and turn a weekly dinner plan into shopping.

## Features

- **Quick-add box**: type `2 milk` and press Enter. A leading number becomes the quantity (`500 g beef` becomes "beef (g)" ×500), and the box stays focused so you can add the next item straight away. Adding an item that is already on the list increases its quantity.
- **Automatic categories**: a built-in keyword map files items under Produce, Dairy, Meat, Bakery, Pantry, Frozen, Household or Other. You can override the category from a dropdown when adding or editing.
- **Grouped list**: each category heading shows how many items are left to buy.
- **Quantity stepper**: every row has − / + buttons.
- **Inline editing**: tap an item's name to change its name, quantity or category. Press Enter to save or Escape to cancel.
- **Check off**: tap the circle to check an item off. It moves, struck through, into a collapsible "In basket" section. Tap it there to put it back on the list.
- **Delete and Clear basket**: remove single items, or remove every checked item at once.
- **Staples tab**: add, edit and remove weekly staples, each with a default quantity and category.
- **Re-add staples (skip)**: use "Add all" or the per-staple Add button. Staples already on the list are badged "On list" and **skipped**, so nothing gets doubled up. The toast says how many were added and skipped.
- **Dinners tab**:
  - Seven day cards in week order. Pick a dinner for each day from a dropdown, or "— None —".
  - "Week starts on" Monday or Sunday reorders the cards without touching your plan.
  - "Add ingredients" puts that dinner's ingredients on the list. The button then reads "Added ✓", and tapping it again asks before adding a second time. It is disabled, with a hint, when the day has no dinner or the dinner has no ingredients.
  - "Add whole week" adds every planned day that hasn't been added yet. "Clear week" empties all days (after a confirmation) but keeps your dinners.
  - "My dinners" is a reusable library: add, rename, duplicate and delete dinners, and edit their ingredients (name, quantity, category) inline like staples. Typing `1 onion` reads the leading number as the quantity, and the category is guessed from the name.
  - Deleting a dinner that is planned on some days asks first, then clears those days.
- **Merging (dinners)**: when a dinner's ingredient is already unchecked on the list, its quantity is **added** to the existing row. If it is already in the basket, it comes back onto the list with the ingredient's quantity. Otherwise a new row is created. A toast reports, for example, "4 added, 2 merged into existing items".
- **Forgiving name matching**: one shared matcher ignores case, extra spaces and simple plurals, so "Onion" and "onions" are the same item for merging, staples and duplicate checks.
- **Tab title counter**: the browser tab shows the number of unchecked items, e.g. "(7) Basket Run", or plain "Basket Run" when nothing is left.
- **Light and dark mode**: follows your system setting by default. The header toggle saves your manual choice. Every screen, prompt and toast follows the theme.
- **Autosave**: everything is saved to localStorage and restored after a reload.
- **JSON export and import**: back up your list, staples, dinners and week plan, or move them to another device. Older export files (list and staples only) still import and leave your dinners alone.
- Responsive from 360px phones to desktop, with large tap targets, full keyboard support and visible focus styles.

## Storage keys

| Key | Contents |
| --- | --- |
| `br.items` | Shopping list items |
| `br.staples` | Weekly staples |
| `br.basketOpen` | Whether the "In basket" section is expanded |
| `br.theme` | `"light"`, `"dark"` or unset (follow system) |
| `br.dinners` | Dinner library: `[{ id, name, ingredients: [{ id, name, qty, category }] }]` |
| `br.plan` | Week plan: `{ weekStart: "mon" \| "sun", days: { mon…sun: dinnerId \| null }, addedDays: { day: dinnerId } }` |

Missing or unreadable `br.dinners` / `br.plan` load as an empty library and an empty week, so data from earlier versions opens untouched.

## How to run

Open `index.html` in any modern browser. The app is a single static page (HTML, CSS and vanilla JavaScript), works offline and keeps its data in the browser's local storage. There is no build step, no server and no internet connection needed. `manifest.webmanifest` lets browsers install it as an app.

## Host it

Upload the folder to any static host (Netlify, Vercel, GitHub Pages, an S3 bucket) or serve it with `npx serve .`.

## Credits

Built with Claude Opus 5.5 through the Vibe Hub app factory.

Released into the public domain. Use it for anything, with no restrictions: copy, change and sell it.
