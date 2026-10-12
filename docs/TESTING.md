# Testing Basket Run (v3)
How the Vibe Hub app factory checked this version before publishing it, and how to repeat the checks.
## Static checks
Every required file present, the page loads only its own files, every script parses, stylesheets balance their braces, JSON files parse.
Result: clean.
## Browser run
No browser was available to this process; the browser run was skipped.
## Acceptance scenarios
No acceptance scenarios ran for this version (they need an AI key to be written from the checklist).
## Tester's checklist
- [ ] Type "2 milk" in the quick-add box and press Enter. Milk should appear under Dairy with quantity 2, and the input should clear and stay focused. Then add "bananas" and confirm it lands in Produce.
- [ ] Use the − / + stepper on an item and edit its name and category inline. The change should stick, and the item should move to its new category heading.
- [ ] Tap an item to check it off. It should strike through and move to "In basket", and the category's remaining count should drop. Tap it again and it should return to its category.
- [ ] Check several items, then press "Clear basket". Only the checked items should be removed. Delete one unchecked item with its delete button.
- [ ] Open the Staples tab, add two staples, then press "Add all". Both should appear on the list. Press "Add all" again and no duplicates should be created, with the existing staples shown as already on the list.
- [ ] Toggle dark mode, reload the page and confirm the theme and every list and staple item persist.
- [ ] Resize from phone width to desktop width. The quick-add box, rows and tap targets should stay usable, with no horizontal scrolling.
## Repeat it yourself
Open `index.html` in a browser (or serve the folder with any static server), then walk the checklist above on a phone-sized window and a desktop one. Reload: your data must still be there.
