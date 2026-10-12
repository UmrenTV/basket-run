# Architecture of Basket Run

A single page of vanilla HTML, CSS and JavaScript. No framework, no build step, no network: state lives in memory and is persisted to `localStorage` so a reload brings everything back.

## Files

- `index.html` (4.0 KB): markup and the page shell
- `styles.css` (9.6 KB): all styling, including the dark theme
- `app.js` (22.0 KB): state, rendering and event handling
- `README.md` (2.5 KB): how to run it

## Data

Everything the user enters is kept in `localStorage` under the app's own keys; export and import, where present, move the same JSON.

## Features

- A quick-add box at the top submits on Enter. It reads a leading number as the quantity ("3 apples") and keeps focus so you can add the next item right away.
- The category is picked automatically from the item name using a built-in keyword map, and you can change it from a dropdown when adding or editing.
- Items are grouped under category headings such as Produce, Dairy, Meat, Bakery, Pantry, Frozen, Household and Other. Each heading shows how many items are left to buy.
- Each row has a − / + quantity stepper, and you can tap the item name to edit its name, quantity or category inline.
- Tap an item to check it off. It is struck through, dimmed and moved into a collapsible "In basket" section at the bottom, and tapping it there unchecks it.
- A delete button on each row, plus a "Clear basket" action that removes all checked items at once.
- A Staples tab where you can add, edit and remove weekly staples, each with a default quantity and category.
- On the Staples tab, an "Add all" button and a per-item add button re-add staples to the list. Staples already on the list are badged and skipped, so nothing is duplicated.
- A dark mode toggle in the header starts from the system theme, saves your manual choice and uses CSS variables for all colours.
- The list, staples and theme choice save automatically to local storage and come back exactly as you left them after a reload.
