# The story of Basket Run
One household grocery list: quick-add, check off, and re-add your weekly staples in a tap
## The request
> A shared grocery list for one household: items with a quantity and a category, check items off as they go into the basket, a quick-add box, a weekly staples list that can be re-added in one tap, and dark mode.
Asked for as a web app on 2026-10-12 and built by the Vibe Hub app factory on Claude Opus 5.5. It is self-contained: no accounts, no servers, data stays on the device.
## What the research found
Shared grocery apps such as AnyList, OurGroceries and Bring! all work the same way. One household list is synced to everyone's phone. Items are auto-categorised by store aisle, and checking an item off moves it out of the way. Repeat buying is handled by Favorites, a master list or a staples list that can be re-added quickly. A self-contained offline build can't sync between devices, so it should treat 'shared' as one household list on one device. It should add export/import so the list can be shared by other means.
### What users expect from apps like this

- Add an item with a name, quantity and category
- Quick-add box that submits on Enter and suggests items you've added before
- Auto-suggest or auto-pick the category from the item name
- Tap to check an item off, moving it to a 'in basket' section at the bottom that can be unchecked
- Items grouped under category headings, such as produce, dairy and pantry
- Edit or delete an item, and clear all checked items in one action
- Weekly staples list with a one-tap 'add all' and a per-item add
- Dark mode that follows the system setting and can be toggled by hand, with the choice saved
- List and settings persist in local storage
### What full versions add later

- Real-time multi-device sync with household accounts and invites
- Multiple named lists, for example one per store
- Recipe import and meal planning that adds ingredients to the list
- Drag-to-reorder categories to match your store's aisle order
- Price and budget tracking
- Voice assistant or barcode input
### Patterns that work

- Quick-add input fixed at the top or bottom, so one-handed use works and focus stays in the field after each add
- Category sections that collapse, with a count of items left to buy
- Large tap targets for check-off, with checked items struck through and dimmed, then moved to a collapsed 'in basket' group
- Separate Staples tab or sheet with checkboxes and a prominent 'Add selected' or 'Add all' button. It shows which staples are already on the list.
- Quantity stepper (− / +) or an inline number field on each row
- Theme toggle in the header, using CSS variables for the colours
- Export and import as JSON, plus a plain-text copy, to stand in for sharing
### References

- [AnyList - Compare Features](https://www.anylist.com/features)
- [6 Best Grocery List Apps for Recipes and Shared Shopping](https://cookbookmanager.com/post/best-grocery-list-apps)
- [Our Groceries Shopping List - Apps on Google Play](https://play.google.com/store/apps/details?id=com.headcode.ourgroceries&hl=en_US)
## The plan
Basket Run is a grocery list for one household, kept on the device you shop with. You type an item into the quick-add box at the top, such as "2 milk", and press Enter. It lands under the right category heading, for example Dairy, Produce or Pantry, with its quantity attached. The box stays focused, so you can add a whole week's shopping without lifting your thumb. In the store, tap an item as it goes into your cart. It is struck through and slides down into an "In basket" group at the bottom, and you can tap it again to put it back. When you get home, one button clears everything you bought. The things you buy every week, like bread, eggs and bananas, live on a Staples list. Add them all back with one tap, or pick just the ones you need. Staples already on the list are marked, so nothing gets doubled up. Basket Run looks calm and works at any screen size. Rows and buttons are large and easy to tap on a phone. Dark mode follows your system setting, or you can switch it by hand. Everything saves automatically on your device, with no account and no internet needed.
Scope: simple. Layout: vanilla HTML, CSS and JavaScript, offline, local storage.
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
### Left out on purpose

- Real-time sync across devices, household accounts or invites (the list lives on one device)
- Export/import as JSON or a plain-text copy for sharing
- Suggestions in the quick-add box from items you've added before
- Multiple named lists or per-store lists
- Drag-to-reorder categories or aisle-order customisation
- Recipe import, meal planning, or adding ingredients from recipes
- Price, budget or spending tracking
- Voice input and barcode scanning
## Versions
- v1 (2026-10-12): One household grocery list: quick-add, check off, and re-add your weekly staples in a tap
- v2 (2026-10-12): Weekly Dinner Plan Tab
The current version is v2. Every version is a commit on `main`; CHANGELOG.md has the details and docs/TESTING.md how each one was checked.
