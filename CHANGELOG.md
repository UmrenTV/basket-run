# Changelog

All notable changes to Basket Run. Each version is one commit on `main`, published by the Vibe Hub app factory after its checks passed.

## v3 — Rolled back to v1 (2026-10-12)

Rolled back to v1: One household grocery list: quick-add, check off, and re-add your weekly staples in a tap

## v2 — Weekly Dinner Plan Tab (2026-10-12)

A new Dinners tab sits next to List and Staples. You keep a small library of dinners, each with ingredients that have a quantity and category, and assign one to each day of the week. One tap on a day adds that dinner's ingredients to the shopping list. Ingredients already on the list are merged by adding the quantities, and a toast reports what happened. The browser tab title now shows how many items are still unchecked, for example "(7) Basket Run". All new screens follow the light/dark theme.

### Added

- Dinners tab with a seven-day weekly plan
- Reusable dinner library with ingredient lists (name, quantity, category) and a duplicate option
- One-tap 'Add ingredients' per day and 'Add whole week'
- Quantity merging for ingredients already on the list, with a summary toast
- 'Week starts on' Monday/Sunday setting and 'Clear week'
- Unchecked-item count in the browser tab title

### Changed

- Header tabs expanded from List/Staples to List/Staples/Dinners
- Staples 'already on list' matching now ignores case and simple plurals via the shared matcher (still skips, never merges)
- Toast feedback now also appears when adding staples

Requested as: "Add a weekly dinner plan: a second tab where each day of the week gets a dinner, and one tap adds that dinner's ingredients to the shopping list. Also show how many items are still unchecked in the page title, and keep dark mode working everywhere."

## v1 — First build (2026-10-12)

One household grocery list: quick-add, check off, and re-add your weekly staples in a tap

### Features

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
