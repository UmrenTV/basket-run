# Basket Run

One household grocery list, kept on the device you shop with. Quick-add items, check them off as they go into the cart, and re-add your weekly staples in a tap.

## Features

- **Quick-add box**: type `2 milk` and press Enter. A leading number becomes the quantity, and the box stays focused so you can add the next item straight away. Adding an item that is already on the list increases its quantity.
- **Automatic categories**: a built-in keyword map files items under Produce, Dairy, Meat, Bakery, Pantry, Frozen, Household or Other. You can override the category from a dropdown when adding or editing.
- **Grouped list**: each category heading shows how many items are left to buy.
- **Quantity stepper**: every row has − / + buttons.
- **Inline editing**: tap an item's name to change its name, quantity or category. Press Enter to save or Escape to cancel.
- **Check off**: tap the circle to check an item off. It moves, struck through, into a collapsible "In basket" section. Tap it there to put it back on the list.
- **Delete and Clear basket**: remove single items, or remove every checked item at once.
- **Staples tab**: add, edit and remove weekly staples, each with a default quantity and category.
- **Re-add staples**: use "Add all" or the per-staple Add button. Staples already on the list are badged "On list" and skipped, so nothing gets doubled up.
- **Light and dark mode**: follows your system setting by default. The header toggle saves your manual choice.
- **Autosave**: the list, staples and theme are saved to localStorage and restored after a reload.
- **JSON export and import**: back up your data or move it to another device.
- Responsive from 360px phones to desktop, with large tap targets, full keyboard support and visible focus styles.

## How to run

Open `index.html` in any modern browser. There is no build step, no server and no internet connection needed.

## Credits

Built with Claude Opus 5.5 through the Vibe Hub app factory.

Released into the public domain. Use it for anything, with no restrictions.

## Run it

Open `index.html` in any browser: the app is a single static page (HTML, CSS and vanilla JavaScript), works offline and keeps its data in the browser's local storage. `manifest.webmanifest` lets browsers install it as an app.

## Host it

Upload the folder to any static host (Netlify, Vercel, GitHub Pages, an S3 bucket) or serve it with `npx serve .`.

## Built with

Claude Opus 5.5 through the Vibe Hub app factory (web target, simple scope). No license restrictions: copy, change and sell it.
