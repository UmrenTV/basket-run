(function () {
  'use strict';

  var CATS = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Household', 'Other'];
  // Specific phrases first so "peanut butter" is not filed under Dairy.
  var OVERRIDES = [
    ['peanut butter', 'Pantry'], ['ice cream', 'Frozen'], ['frozen', 'Frozen'], ['coconut milk', 'Pantry'],
    ['paper towel', 'Household'], ['toilet paper', 'Household'], ['fish fingers', 'Frozen'], ['fish sticks', 'Frozen']
  ];
  var KEYWORDS = {
    Produce: 'apple pineapple banana orange lemon lime grape berry berries strawberr blueberr raspberr tomato potato onion garlic carrot lettuce spinach kale cucumber pepper broccoli cauliflower avocado mushroom celery zucchini courgette pear peach plum melon watermelon mango herb basil cilantro coriander parsley mint ginger fruit salad cabbage leek corn squash pumpkin',
    Dairy: 'milk cheese cheddar mozzarella parmesan feta yogurt yoghurt butter cream egg kefir',
    Meat: 'chicken beef steak pork bacon sausage ham turkey fish salmon cod tuna mince lamb shrimp prawn meat',
    Bakery: 'bread bagel bun roll croissant muffin tortilla wrap baguette cake pita sourdough loaf',
    Frozen: 'pizza popsicle ice',
    Pantry: 'rice pasta spaghetti noodle flour sugar salt oil cereal oat bean lentil sauce coffee tea honey jam soup spice vinegar peanut nut almond cracker chip crisp cookie biscuit ketchup mustard mayo can tinned chocolate snack water juice soda',
    Household: 'soap detergent paper towel tissue toilet shampoo conditioner toothpaste toothbrush sponge bag foil cling bleach cleaner battery batteries dish deodorant razor nappy diaper'
  };
  var MATCHERS = [];
  OVERRIDES.forEach(function (o) { MATCHERS.push([new RegExp('\\b' + o[0]), o[1]]); });
  Object.keys(KEYWORDS).forEach(function (cat) {
    KEYWORDS[cat].split(' ').forEach(function (w) { MATCHERS.push([new RegExp('\\b' + w), cat]); });
  });

  function guessCat(name) {
    var n = String(name).toLowerCase();
    for (var i = 0; i < MATCHERS.length; i++) if (MATCHERS[i][0].test(n)) return MATCHERS[i][1];
    return 'Other';
  }

  var MAX_QTY = 9999;
  var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    }
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function clampQty(q) { q = parseInt(q, 10); return isNaN(q) ? 1 : Math.min(MAX_QTY, Math.max(1, q)); }
  function tidy(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 80); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function joinList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  // The one matcher for "is this the same item": used by list merging, staples and dinners.
  // Only for comparison; display names are never changed.
  function normaliseName(s) {
    var n = String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (/(?:oes|ches|shes|xes|sses)$/.test(n) && n.length - 2 > 3) return n.slice(0, -2);
    if (/[^s]s$/.test(n) && n.length - 1 > 3) return n.slice(0, -1);
    return n;
  }
  function same(a, b) { return normaliseName(a) === normaliseName(b); }

  function cleanItem(o, isStaple) {
    if (!o || typeof o.name !== 'string' || !tidy(o.name)) return null;
    var name = tidy(o.name);
    var out = { id: typeof o.id === 'string' && o.id ? o.id : uid(), name: name, qty: clampQty(o.qty), cat: CATS.indexOf(o.cat) >= 0 ? o.cat : guessCat(name) };
    if (!isStaple) { out.checked = !!o.checked; out.addedAt = Number(o.addedAt) || Date.now(); }
    return out;
  }
  function cleanList(arr, isStaple) {
    if (!Array.isArray(arr)) return [];
    return arr.map(function (o) { return cleanItem(o, isStaple); }).filter(Boolean);
  }
  function cleanDinners(arr) {
    if (!Array.isArray(arr)) return [];
    var seen = {};
    return arr.map(function (d) {
      if (!d || typeof d.name !== 'string' || !tidy(d.name)) return null;
      var id = typeof d.id === 'string' && d.id && !seen[d.id] ? d.id : uid();
      seen[id] = true;
      var ings = Array.isArray(d.ingredients) ? d.ingredients.map(function (g) {
        if (!g || typeof g.name !== 'string' || !tidy(g.name)) return null;
        var name = tidy(g.name);
        return { id: typeof g.id === 'string' && g.id ? g.id : uid(), name: name, qty: clampQty(g.qty), category: CATS.indexOf(g.category) >= 0 ? g.category : guessCat(name) };
      }).filter(Boolean) : [];
      return { id: id, name: tidy(d.name), ingredients: ings };
    }).filter(Boolean);
  }
  function cleanPlan(p, dinners) {
    p = p && typeof p === 'object' ? p : {};
    var ids = {};
    dinners.forEach(function (d) { ids[d.id] = true; });
    var src = p.days && typeof p.days === 'object' ? p.days : {};
    var srcAdded = p.addedDays && typeof p.addedDays === 'object' ? p.addedDays : {};
    var days = {}, added = {};
    DAYS.forEach(function (k) {
      days[k] = typeof src[k] === 'string' && ids[src[k]] ? src[k] : null;
      if (days[k] && srcAdded[k] === days[k]) added[k] = days[k];
    });
    return { weekStart: p.weekStart === 'sun' ? 'sun' : 'mon', days: days, addedDays: added };
  }

  var loadedDinners = cleanDinners(store.get('br.dinners', []));
  var state = {
    items: cleanList(store.get('br.items', []), false),
    staples: cleanList(store.get('br.staples', []), true),
    dinners: loadedDinners,
    plan: cleanPlan(store.get('br.plan', null), loadedDinners),
    basketOpen: store.get('br.basketOpen', true) !== false,
    tab: 'list',
    editing: null,
    openDinner: null
  };
  function save() {
    store.set('br.items', state.items);
    store.set('br.staples', state.staples);
    store.set('br.basketOpen', state.basketOpen);
    store.set('br.dinners', state.dinners);
    store.set('br.plan', state.plan);
  }

  function $(s) { return document.querySelector(s); }
  function el(tag, props) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(n, arguments[i]);
    return n;
  }
  function append(n, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(n, x); }); return; }
    n.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  var PATHS = {
    check: 'M5 12l5 5L20 7', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    edit: 'M4 20h4L19 9l-4-4L4 16v4z', chevron: 'M6 9l6 6 6-6',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
    sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'
  };
  function icon(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', PATHS[name]);
    s.appendChild(p);
    return s;
  }
  function fillCatSelect(sel, value, withAuto) {
    sel.replaceChildren();
    if (withAuto) sel.appendChild(el('option', { value: 'auto', text: 'Auto' }));
    CATS.forEach(function (c) { sel.appendChild(el('option', { value: c, text: c })); });
    sel.value = value || (withAuto ? 'auto' : 'Other');
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  // Themed confirm prompt; falls back to window.confirm where <dialog> is unsupported.
  var dlg = $('#confirm'), pendingConfirm = null;
  function askConfirm(msg, okLabel, onOk) {
    if (!dlg || typeof dlg.showModal !== 'function') { if (window.confirm(msg)) onOk(); return; }
    $('#confirm-msg').textContent = msg;
    $('#confirm-ok').textContent = okLabel || 'OK';
    pendingConfirm = onOk;
    dlg.returnValue = '';
    dlg.showModal();
  }
  if (dlg) dlg.addEventListener('close', function () {
    var cb = pendingConfirm;
    pendingConfirm = null;
    if (dlg.returnValue === 'ok' && cb) cb();
  });

  // Theme
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effectiveTheme() { return store.get('br.theme', null) || (mq && mq.matches ? 'dark' : 'light'); }
  function applyTheme() {
    var t = store.get('br.theme', null);
    if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    var dark = effectiveTheme() === 'dark';
    var btn = $('#theme-toggle');
    btn.replaceChildren(icon(dark ? 'sun' : 'moon'));
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  $('#theme-toggle').addEventListener('click', function () {
    store.set('br.theme', effectiveTheme() === 'dark' ? 'light' : 'dark');
    applyTheme();
  });
  if (mq) {
    var onMq = function () { if (!store.get('br.theme', null)) applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  // Data operations
  function addItem(name, qty, cat) {
    var hit = state.items.filter(function (i) { return same(i.name, name); });
    var open = hit.filter(function (i) { return !i.checked; })[0];
    if (open) { open.qty = clampQty(open.qty + qty); return { kind: 'merged', item: open }; }
    if (hit[0]) { hit[0].checked = false; hit[0].qty = qty; hit[0].cat = cat; return { kind: 'restored', item: hit[0] }; }
    var it = { id: uid(), name: name, qty: qty, cat: cat, checked: false, addedAt: Date.now() };
    state.items.push(it);
    return { kind: 'added', item: it };
  }
  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function onList(s) { return state.items.some(function (i) { return !i.checked && same(i.name, s.name); }); }
  var UNIT_RE = /^(\d{1,4})\s*(kg|g|mg|ml|l|oz|lbs?|tbsp|tsp|cups?|packs?|tins?|cans?|cloves?|slices?|bunch(?:es)?)\.?\s+(.+)$/i;
  function parseQuick(text) {
    var t = tidy(text);
    var u = t.match(UNIT_RE);
    if (u && /[a-z]/i.test(u[3])) {
      var unit = u[2].toLowerCase().replace(/^(lb|cup|pack|tin|can|clove|slice)s$/, '$1').replace(/^bunches$/, 'bunch');
      return { qty: clampQty(u[1]), name: tidy(u[3] + ' (' + unit + ')') };
    }
    var m = t.match(/^(\d{1,4})\s*(?:[x×]\s+)?(.+)$/i);
    if (m && /[a-z]/i.test(m[2])) return { qty: clampQty(m[1]), name: tidy(m[2]) };
    return { qty: 1, name: t };
  }

  // Single derivation for the tab title; render() runs after every list mutation and on load.
  function updateTitle() {
    var n = state.items.filter(function (i) { return !i.checked; }).length;
    document.title = n ? '(' + n + ') Basket Run' : 'Basket Run';
    return n;
  }

  var focusKey = null;
  function render() {
    var a = document.activeElement;
    var key = focusKey || (a && a.dataset ? a.dataset.key : null);
    focusKey = null;
    renderList();
    renderStaples();
    renderDinners();
    $('#list-count').textContent = updateTitle();
    $('#staples-count').textContent = state.staples.length;
    $('#dinners-count').textContent = DAYS.filter(function (k) { return state.plan.days[k]; }).length;
    if (key) {
      var target = document.querySelector('[data-key="' + key + '"]');
      if (target) target.focus();
    }
  }

  function stepper(obj) {
    var dec = function () { if (obj.qty > 1) { obj.qty--; save(); render(); } };
    var inc = function () { if (obj.qty < MAX_QTY) { obj.qty++; save(); render(); } };
    return el('div', { class: 'stepper', role: 'group', 'aria-label': 'Quantity of ' + obj.name },
      el('button', { type: 'button', 'aria-label': 'Decrease ' + obj.name, 'aria-disabled': obj.qty <= 1 ? 'true' : null, 'data-key': 'dec-' + obj.id, onclick: dec }, icon('minus')),
      el('span', { class: 'qty', text: String(obj.qty) }),
      el('button', { type: 'button', 'aria-label': 'Increase ' + obj.name, 'data-key': 'inc-' + obj.id, onclick: inc }, icon('plus')));
  }

  // Shared inline editor for list items, staples and dinner ingredients.
  function editRow(obj, kind, list) {
    var catKey = kind === 'ing' ? 'category' : 'cat';
    var nameIn = el('input', { class: 'input', id: 'e-name', type: 'text', maxlength: '80', value: obj.name, required: true, 'data-key': 'edit-name' });
    var qtyIn = el('input', { class: 'input', id: 'e-qty', type: 'number', min: '1', max: String(MAX_QTY), value: String(obj.qty), inputmode: 'numeric' });
    var catSel = el('select', { class: 'input', id: 'e-cat' });
    fillCatSelect(catSel, obj[catKey], false);
    var back = { item: 'edit-', staple: 'sedit-', ing: 'iedit-' }[kind] + obj.id;
    function close() { state.editing = null; focusKey = back; render(); }
    var form = el('form', {
      class: 'edit', 'aria-label': 'Edit ' + obj.name,
      onsubmit: function (e) {
        e.preventDefault();
        var name = tidy(nameIn.value);
        if (!name) { nameIn.focus(); toast('Name can’t be empty'); return; }
        var clash = list.some(function (x) { return x !== obj && same(x.name, name) && (kind !== 'item' || !x.checked) && !obj.checked; });
        if (clash) { toast(name + ' is already listed'); nameIn.focus(); return; }
        obj.name = name; obj.qty = clampQty(qtyIn.value); obj[catKey] = catSel.value;
        save(); close();
        toast('Saved ' + name);
      },
      onkeydown: function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    },
      el('div', { class: 'field grow' }, el('label', { for: 'e-name', text: 'Name' }), nameIn),
      el('div', { class: 'field qty-field' }, el('label', { for: 'e-qty', text: 'Qty' }), qtyIn),
      el('div', { class: 'field' }, el('label', { for: 'e-cat', text: 'Category' }), catSel),
      el('div', { class: 'edit-actions' },
        el('button', { class: 'btn primary small', type: 'submit', text: 'Save' }),
        el('button', { class: 'btn small', type: 'button', text: 'Cancel', onclick: close })));
    focusKey = focusKey || 'edit-name';
    return el('li', { class: 'row' }, form);
  }

  function startEdit(kind, id) { state.editing = { kind: kind, id: id }; focusKey = 'edit-name'; render(); }
  function isEditing(kind, id) { return state.editing && state.editing.kind === kind && state.editing.id === id; }

  function deleteItem(id) {
    var it = find(state.items, id);
    state.items = state.items.filter(function (x) { return x.id !== id; });
    save(); focusKey = 'quick'; render();
    $('#quick-input').focus();
    if (it) toast('Deleted ' + it.name);
  }

  function orderedOpen() {
    var out = [];
    CATS.forEach(function (c) {
      state.items.forEach(function (i) { if (!i.checked && i.cat === c) out.push(i); });
    });
    return out;
  }

  function toggleCheck(id) {
    var it = find(state.items, id);
    if (!it) return;
    if (!it.checked) {
      var order = orderedOpen();
      var idx = order.indexOf(it);
      var next = order[idx + 1] || order[idx - 1];
      it.checked = true;
      focusKey = next ? 'check-' + next.id : null;
      save(); render();
      if (!next) $('#quick-input').focus();
    } else {
      var dupe = state.items.filter(function (x) { return x !== it && !x.checked && same(x.name, it.name); })[0];
      if (dupe) { dupe.qty = clampQty(dupe.qty + it.qty); state.items = state.items.filter(function (x) { return x !== it; }); focusKey = 'check-' + dupe.id; }
      else { it.checked = false; focusKey = 'check-' + it.id; }
      save(); render();
    }
  }

  function itemRow(it) {
    if (isEditing('item', it.id)) return editRow(it, 'item', state.items);
    return el('li', { class: 'row' },
      el('button', { class: 'check', type: 'button', 'aria-label': 'Check off ' + it.name, 'data-key': 'check-' + it.id, onclick: function () { toggleCheck(it.id); } }, el('span', { class: 'circle' })),
      el('button', { class: 'name', type: 'button', 'aria-label': 'Edit ' + it.name, 'data-key': 'edit-' + it.id, onclick: function () { startEdit('item', it.id); } }, el('span', { class: 'name-text', text: it.name })),
      stepper(it),
      el('button', { class: 'icon-btn del', type: 'button', 'aria-label': 'Delete ' + it.name, onclick: function () { deleteItem(it.id); } }, icon('trash')));
  }

  function renderList() {
    var box = $('#list');
    box.replaceChildren();
    var open = state.items.filter(function (i) { return !i.checked; });
    var done = state.items.filter(function (i) { return i.checked; });
    CATS.forEach(function (cat) {
      var its = open.filter(function (i) { return i.cat === cat; });
      if (!its.length) return;
      box.appendChild(el('section', { class: 'cat', 'aria-labelledby': 'h-' + cat },
        el('h2', { class: 'cat-head', id: 'h-' + cat }, el('span', { text: cat }), el('span', { class: 'count', text: its.length + ' left' })),
        el('ul', { class: 'rows' }, its.map(itemRow))));
    });
    if (!open.length) {
      var msg = done.length ? 'Everything is in the basket. Nice run!' : 'Your list is empty. Add something above, re-add your weekly staples, or add a planned dinner.';
      box.appendChild(el('div', { class: 'empty' }, el('p', { text: msg }),
        state.staples.length && !done.length ? el('button', { class: 'btn', type: 'button', text: 'Go to staples', onclick: function () { selectTab('staples', true); } }) : null));
    }

    var basket = $('#basket');
    basket.replaceChildren();
    basket.hidden = !done.length;
    if (!done.length) return;
    basket.appendChild(el('div', { class: 'basket-head' },
      el('button', {
        class: 'basket-toggle', id: 'basket-toggle', type: 'button', 'aria-expanded': String(state.basketOpen), 'aria-controls': 'basket-list', 'data-key': 'basket-toggle',
        onclick: function () { state.basketOpen = !state.basketOpen; save(); render(); }
      }, icon('chevron'), 'In basket (' + done.length + ')'),
      el('button', { class: 'btn small danger', type: 'button', text: 'Clear basket', onclick: clearBasket })));
    basket.appendChild(el('ul', { class: 'rows', id: 'basket-list', hidden: !state.basketOpen },
      done.map(function (it) {
        return el('li', { class: 'row done' },
          el('button', { class: 'uncheck', type: 'button', 'aria-label': 'Put ' + it.name + ' back on the list', 'data-key': 'uncheck-' + it.id, onclick: function () { toggleCheck(it.id); } },
            el('span', { class: 'circle' }, icon('check')),
            el('span', { class: 'name-text', text: it.name }),
            el('span', { class: 'muted-qty', text: '×' + it.qty })),
          el('button', { class: 'icon-btn del', type: 'button', 'aria-label': 'Delete ' + it.name, onclick: function () { deleteItem(it.id); } }, icon('trash')));
      })));
  }

  function clearBasket() {
    var n = state.items.filter(function (i) { return i.checked; }).length;
    state.items = state.items.filter(function (i) { return !i.checked; });
    save(); render();
    $('#quick-input').focus();
    toast('Cleared ' + n + ' item' + (n === 1 ? '' : 's') + ' from the basket');
  }

  // Staples: skip if already on the list, never merge.
  function addStapleToList(s) {
    if (onList(s)) return false;
    addItem(s.name, s.qty, s.cat);
    return true;
  }
  function renderStaples() {
    var ul = $('#staples-list');
    ul.replaceChildren();
    var missing = state.staples.filter(function (s) { return !onList(s); }).length;
    var addAll = $('#add-all');
    addAll.disabled = !missing;
    addAll.textContent = state.staples.length && !missing ? 'All on list' : 'Add all' + (missing ? ' (' + missing + ')' : '');
    if (!state.staples.length) {
      ul.appendChild(el('li', { class: 'row' }, el('span', { class: 'meta', text: 'No staples yet. Save the things you buy every week above.' })));
      return;
    }
    state.staples.forEach(function (s) {
      if (isEditing('staple', s.id)) { ul.appendChild(editRow(s, 'staple', state.staples)); return; }
      var on = onList(s);
      ul.appendChild(el('li', { class: 'row' },
        el('div', { class: 'staple-info' }, el('span', { class: 'name-text', text: s.name }), el('span', { class: 'meta', text: '×' + s.qty + ' · ' + s.cat })),
        on ? el('span', { class: 'badge' }, icon('check'), 'On list')
          : el('button', {
            class: 'btn small primary', type: 'button', 'aria-label': 'Add ' + s.name + ' to list', 'data-key': 'sadd-' + s.id,
            onclick: function () { addStapleToList(s); save(); focusKey = 'sedit-' + s.id; render(); toast('Added staple ' + s.name + ' to ' + s.cat); }
          }, icon('plus'), 'Add'),
        el('button', { class: 'icon-btn', type: 'button', 'data-key': 'sedit-' + s.id, onclick: function () { startEdit('staple', s.id); } }, icon('edit'), el('span', { class: 'sr-only', text: 'Edit staple ' + s.name })),
        el('button', {
          class: 'icon-btn del', type: 'button',
          onclick: function () { state.staples = state.staples.filter(function (x) { return x !== s; }); save(); render(); $('#staple-name').focus(); toast('Removed staple ' + s.name); }
        }, icon('trash'), el('span', { class: 'sr-only', text: 'Remove staple ' + s.name }))));
    });
  }

  $('#add-all').addEventListener('click', function () {
    var added = 0, skipped = 0;
    state.staples.forEach(function (s) { if (addStapleToList(s)) added++; else skipped++; });
    save(); render();
    toast('Added ' + plural(added, 'staple') + (skipped ? ', skipped ' + skipped + ' already on the list' : ''));
    if (!added || $('#add-all').disabled) $('#staple-name').focus();
  });

  var sName = $('#staple-name'), sQty = $('#staple-qty'), sCat = $('#staple-cat');
  fillCatSelect(sCat, 'auto', true);
  $('#staple-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = tidy(sName.value);
    if (!name) { sName.focus(); return; }
    if (state.staples.some(function (s) { return same(s.name, name); })) { toast(name + ' is already a staple'); sName.focus(); return; }
    var cat = sCat.value === 'auto' ? guessCat(name) : sCat.value;
    state.staples.push({ id: uid(), name: name, qty: clampQty(sQty.value), cat: cat });
    save(); render();
    sName.value = ''; sQty.value = '1'; sCat.value = 'auto';
    sName.focus();
    toast('Saved staple ' + name + ' (' + cat + ')');
  });

  // Dinners: plan and library
  function dinnerById(id) { return id ? find(state.dinners, id) : null; }
  function weekOrder() { return state.plan.weekStart === 'sun' ? ['sun'].concat(DAYS.slice(0, 6)) : DAYS; }
  function isAdded(day) { var id = state.plan.days[day]; return !!id && state.plan.addedDays[day] === id; }
  function daysUsing(id) { return weekOrder().filter(function (k) { return state.plan.days[k] === id; }); }
  function addableDays() { return weekOrder().filter(function (k) { var d = dinnerById(state.plan.days[k]); return d && d.ingredients.length; }); }

  // Merge: unchecked match sums, checked match comes back with the ingredient qty, else a new row.
  function addDinnerToList(d, tally) {
    d.ingredients.forEach(function (g) { tally[addItem(g.name, g.qty, g.category).kind]++; });
  }
  function summary(t) {
    var parts = [];
    if (t.added) parts.push(t.added + ' added');
    if (t.merged) parts.push(t.merged + ' merged into existing items');
    if (t.restored) parts.push(t.restored + ' moved back from the basket');
    return parts.join(', ') || 'nothing to add';
  }
  function addDays(days) {
    var t = { added: 0, merged: 0, restored: 0 };
    days.forEach(function (k) {
      var d = dinnerById(state.plan.days[k]);
      addDinnerToList(d, t);
      state.plan.addedDays[k] = d.id;
    });
    save();
    return t;
  }
  function addDay(day) {
    var d = dinnerById(state.plan.days[day]);
    if (!d || !d.ingredients.length) return;
    function go() { var t = addDays([day]); focusKey = 'dadd-' + day; render(); toast(DAY_NAMES[day] + ': ' + summary(t)); }
    if (isAdded(day)) askConfirm('Add these ingredients again? ' + d.name + ' is already on the list for ' + DAY_NAMES[day] + ', so the quantities will go up.', 'Add again', go);
    else go();
  }

  $('#add-week').addEventListener('click', function () {
    var all = addableDays();
    if (!all.length) return;
    var todo = all.filter(function (k) { return !isAdded(k); });
    function go(list) { var t = addDays(list); focusKey = 'add-week'; render(); toast('Added ' + plural(list.length, 'day') + ': ' + summary(t)); }
    if (todo.length) go(todo);
    else askConfirm('Every planned day is already on the list. Add the whole week again?', 'Add again', function () { go(all); });
  });
  $('#clear-week').addEventListener('click', function () {
    askConfirm('Clear all seven days? Your saved dinners stay in “My dinners”.', 'Clear week', function () {
      DAYS.forEach(function (k) { state.plan.days[k] = null; });
      state.plan.addedDays = {};
      save(); focusKey = 'week-start'; render();
      toast('Week cleared');
    });
  });
  $('#week-start').setAttribute('data-key', 'week-start');
  $('#add-week').setAttribute('data-key', 'add-week');
  $('#week-start').addEventListener('change', function (e) {
    state.plan.weekStart = e.target.value === 'sun' ? 'sun' : 'mon';
    save(); render();
  });

  function openDinner(id) { state.openDinner = id; state.editing = null; focusKey = 'ing-name'; render(); }
  function toggleDinner(id) {
    state.openDinner = state.openDinner === id ? null : id;
    state.editing = null; focusKey = 'dtog-' + id; render();
  }
  function uniqueDinnerName(base) {
    var name = tidy(base), n = 2;
    while (state.dinners.some(function (x) { return same(x.name, name); })) name = tidy(base + ' ' + n++);
    return name;
  }
  function duplicateDinner(d) {
    var copy = { id: uid(), name: uniqueDinnerName(d.name + ' (copy)'), ingredients: d.ingredients.map(function (g) { return { id: uid(), name: g.name, qty: g.qty, category: g.category }; }) };
    state.dinners.splice(state.dinners.indexOf(d) + 1, 0, copy);
    state.openDinner = copy.id; state.editing = null;
    save(); focusKey = 'dn-rename'; render();
    toast('Duplicated as ' + copy.name);
  }
  function deleteDinner(d) {
    var days = daysUsing(d.id);
    function go() {
      state.dinners = state.dinners.filter(function (x) { return x !== d; });
      DAYS.forEach(function (k) { if (state.plan.days[k] === d.id) { state.plan.days[k] = null; delete state.plan.addedDays[k]; } });
      if (state.openDinner === d.id) state.openDinner = null;
      state.editing = null;
      save(); focusKey = 'dinner-name'; render();
      toast('Deleted ' + d.name + (days.length ? ' and cleared ' + plural(days.length, 'day') : ''));
    }
    if (days.length) askConfirm('Delete “' + d.name + '”? It is planned for ' + joinList(days.map(function (k) { return DAY_NAMES[k]; })) + ', and those days will be cleared.', 'Delete', go);
    else if (d.ingredients.length) askConfirm('Delete “' + d.name + '” and its ' + plural(d.ingredients.length, 'ingredient') + '?', 'Delete', go);
    else go();
  }

  function dayCard(day) {
    var d = dinnerById(state.plan.days[day]);
    var n = d ? d.ingredients.length : 0, added = isAdded(day), name = DAY_NAMES[day];
    var sel = el('select', {
      class: 'input', id: 'day-' + day, 'data-key': 'dsel-' + day,
      onchange: function () { state.plan.days[day] = sel.value || null; delete state.plan.addedDays[day]; save(); render(); }
    }, el('option', { value: '', text: '— None —' }), state.dinners.map(function (x) { return el('option', { value: x.id, text: x.name }); }));
    sel.value = d ? d.id : '';
    var info = !d ? el('p', { class: 'meta', text: state.dinners.length ? 'No dinner planned' : 'Add a dinner below to plan this day' })
      : n ? el('p', { class: 'meta', text: plural(n, 'ingredient') })
        : el('p', { class: 'meta' }, 'No ingredients yet – ', el('button', { class: 'link', type: 'button', 'data-key': 'dedit-' + day, onclick: function () { openDinner(d.id); } }, 'edit dinner'));
    var btn = el('button', {
      class: 'btn small ' + (added ? 'added' : 'primary'), type: 'button', 'data-key': 'dadd-' + day, disabled: !n,
      'aria-label': !d ? 'Add ingredients for ' + name + ' (no dinner planned)' : added ? 'Added ' + d.name + ' for ' + name + '. Add again' : 'Add ' + d.name + ' ingredients for ' + name,
      onclick: function () { addDay(day); }
    }, added ? 'Added ✓' : [icon('plus'), 'Add ingredients']);
    return el('li', { class: 'card day' + (d ? ' planned' : '') },
      el('h3', { class: 'day-name', text: name }),
      el('div', { class: 'field' }, el('label', { for: 'day-' + day, text: 'Dinner' }), sel),
      info, btn);
  }

  var ING_HINT = 'Start with a number for the quantity, e.g. 1 onion or 500 g beef.';
  function dinnerEditor(d) {
    var renameIn = el('input', { class: 'input', id: 'dn-rename', type: 'text', maxlength: '80', value: d.name, required: true, 'data-key': 'dn-rename' });
    var renameForm = el('form', {
      class: 'dn-rename', 'aria-label': 'Rename ' + d.name, autocomplete: 'off',
      onsubmit: function (e) {
        e.preventDefault();
        var name = tidy(renameIn.value);
        if (!name) { toast('Name can’t be empty'); renameIn.focus(); return; }
        if (state.dinners.some(function (x) { return x !== d && same(x.name, name); })) { toast(name + ' is already a dinner'); renameIn.focus(); return; }
        d.name = name;
        save(); focusKey = 'dn-rename'; render();
        toast('Renamed to ' + name);
      }
    }, el('div', { class: 'field grow' }, el('label', { for: 'dn-rename', text: 'Dinner name' }), renameIn),
      el('button', { class: 'btn small', type: 'submit', text: 'Rename' }));

    var ings = el('ul', { class: 'rows ings', 'aria-label': 'Ingredients of ' + d.name });
    if (!d.ingredients.length) ings.appendChild(el('li', { class: 'row' }, el('span', { class: 'meta', text: 'No ingredients yet. Add the first one below.' })));
    d.ingredients.forEach(function (g) {
      if (isEditing('ing', g.id)) { ings.appendChild(editRow(g, 'ing', d.ingredients)); return; }
      ings.appendChild(el('li', { class: 'row' },
        el('div', { class: 'staple-info' }, el('span', { class: 'name-text', text: g.name }), el('span', { class: 'meta', text: '×' + g.qty + ' · ' + g.category })),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Edit ingredient ' + g.name, 'data-key': 'iedit-' + g.id, onclick: function () { startEdit('ing', g.id); } }, icon('edit')),
        el('button', {
          class: 'icon-btn del', type: 'button', 'aria-label': 'Remove ingredient ' + g.name,
          onclick: function () { d.ingredients = d.ingredients.filter(function (x) { return x !== g; }); save(); focusKey = 'ing-name'; render(); toast('Removed ' + g.name + ' from ' + d.name); }
        }, icon('trash'))));
    });

    var nIn = el('input', { class: 'input', id: 'ing-name', type: 'text', maxlength: '80', placeholder: 'e.g. 1 onion', required: true, 'data-key': 'ing-name', 'aria-describedby': 'ing-hint' });
    var qIn2 = el('input', { class: 'input', id: 'ing-qty', type: 'number', min: '1', max: String(MAX_QTY), value: '1', inputmode: 'numeric' });
    var cSel = el('select', { class: 'input', id: 'ing-cat' });
    fillCatSelect(cSel, 'auto', true);
    var hint = el('p', { class: 'hint', id: 'ing-hint', text: ING_HINT });
    function parsed() {
      var p = parseQuick(nIn.value);
      var qty = /^\d/.test(tidy(nIn.value)) && p.name !== tidy(nIn.value) ? p.qty : clampQty(qIn2.value);
      return { name: p.name, qty: qty, cat: cSel.value === 'auto' ? guessCat(p.name) : cSel.value };
    }
    function updateHint() { var p = parsed(); hint.textContent = p.name ? 'Will add ' + p.qty + ' × ' + p.name + ' to ' + p.cat : ING_HINT; }
    nIn.addEventListener('input', updateHint);
    qIn2.addEventListener('input', updateHint);
    cSel.addEventListener('change', updateHint);
    var addForm = el('form', {
      class: 'ing-form', 'aria-label': 'Add ingredient to ' + d.name, autocomplete: 'off',
      onsubmit: function (e) {
        e.preventDefault();
        var p = parsed();
        if (!p.name) { nIn.focus(); return; }
        if (d.ingredients.some(function (g) { return same(g.name, p.name); })) { toast(p.name + ' is already in ' + d.name); nIn.focus(); return; }
        d.ingredients.push({ id: uid(), name: p.name, qty: p.qty, category: p.cat });
        save(); focusKey = 'ing-name'; render();
        toast('Added ' + p.name + ' to ' + d.name + ' (' + p.cat + ')');
      }
    },
      el('div', { class: 'field grow' }, el('label', { for: 'ing-name', text: 'Ingredient' }), nIn),
      el('div', { class: 'field qty-field' }, el('label', { for: 'ing-qty', text: 'Qty' }), qIn2),
      el('div', { class: 'field' }, el('label', { for: 'ing-cat', text: 'Category' }), cSel),
      el('button', { class: 'btn small primary', type: 'submit' }, icon('plus'), 'Add ingredient'));
    return el('div', { class: 'dn-editor', id: 'dn-ed-' + d.id }, renameForm, el('h3', { class: 'section-title', text: 'Ingredients' }), ings, addForm, hint);
  }

  function renderDinners() {
    $('#week-start').value = state.plan.weekStart;
    var week = $('#week');
    week.replaceChildren();
    weekOrder().forEach(function (day) { week.appendChild(dayCard(day)); });

    var all = addableDays(), todo = all.filter(function (k) { return !isAdded(k); });
    var addWeek = $('#add-week');
    addWeek.disabled = !all.length;
    addWeek.textContent = todo.length ? 'Add whole week (' + todo.length + ')' : all.length ? 'Week added ✓' : 'Add whole week';
    $('#clear-week').disabled = !DAYS.some(function (k) { return state.plan.days[k]; });

    var box = $('#dinner-list');
    box.replaceChildren();
    if (!state.dinners.length) {
      box.appendChild(el('div', { class: 'empty' }, el('p', { text: 'No dinners yet. Add one above, give it ingredients, then pick it for a day.' })));
      return;
    }
    var ul = el('ul', { class: 'rows' });
    state.dinners.forEach(function (d) {
      var open = state.openDinner === d.id, days = daysUsing(d.id);
      var meta = plural(d.ingredients.length, 'ingredient') + (days.length ? ' · ' + days.map(function (k) { return DAY_NAMES[k].slice(0, 3); }).join(', ') : '');
      var li = el('li', { class: 'dinner' },
        el('div', { class: 'row' },
          el('button', {
            class: 'name dinner-toggle', type: 'button', 'aria-expanded': String(open), 'aria-controls': 'dn-ed-' + d.id, 'data-key': 'dtog-' + d.id,
            'aria-label': (open ? 'Close ' : 'Edit ') + d.name + ', ' + meta, onclick: function () { toggleDinner(d.id); }
          }, icon('chevron'), el('span', { class: 'dinner-title' }, el('span', { class: 'name-text', text: d.name }), el('span', { class: 'meta', text: meta }))),
          el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Duplicate ' + d.name, 'data-key': 'ddup-' + d.id, onclick: function () { duplicateDinner(d); } }, icon('copy')),
          el('button', { class: 'icon-btn del', type: 'button', 'aria-label': 'Delete dinner ' + d.name, 'data-key': 'ddel-' + d.id, onclick: function () { deleteDinner(d); } }, icon('trash'))));
      if (open) li.appendChild(dinnerEditor(d));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  $('#dinner-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#dinner-name'), name = tidy(input.value);
    if (!name) { input.focus(); return; }
    if (state.dinners.some(function (d) { return same(d.name, name); })) { toast(name + ' is already a dinner'); input.focus(); return; }
    var d = { id: uid(), name: name, ingredients: [] };
    state.dinners.push(d);
    state.openDinner = d.id; state.editing = null;
    input.value = '';
    save(); focusKey = 'ing-name'; render();
    toast('Added dinner ' + name + '. Now add its ingredients.');
  });

  // Quick add
  var qIn = $('#quick-input'), qCat = $('#quick-cat'), qHint = $('#quick-hint');
  var defaultHint = qHint.textContent;
  fillCatSelect(qCat, 'auto', true);
  qIn.addEventListener('input', function () {
    var p = parseQuick(qIn.value);
    qHint.textContent = p.name && qCat.value === 'auto' ? 'Will add ' + p.qty + ' × ' + p.name + ' to ' + guessCat(p.name) : defaultHint;
  });
  $('#quick-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var p = parseQuick(qIn.value);
    if (!p.name) { qIn.focus(); return; }
    var cat = qCat.value === 'auto' ? guessCat(p.name) : qCat.value;
    var r = addItem(p.name, p.qty, cat);
    save(); render();
    qIn.value = ''; qCat.value = 'auto'; qHint.textContent = defaultHint;
    qIn.focus();
    toast(r.kind === 'merged' ? r.item.name + ' is now ×' + r.item.qty : 'Added ' + r.item.name + ' to ' + r.item.cat);
  });

  // Tabs
  var TAB_ORDER = ['list', 'staples', 'dinners'];
  var tabs = { list: $('#tab-list'), staples: $('#tab-staples'), dinners: $('#tab-dinners') };
  function selectTab(name, focus) {
    state.tab = name;
    TAB_ORDER.forEach(function (k) {
      var on = k === name;
      tabs[k].setAttribute('aria-selected', String(on));
      tabs[k].tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    if (focus) tabs[name].focus();
  }
  TAB_ORDER.forEach(function (k, i) {
    tabs[k].addEventListener('click', function () { selectTab(k); });
    tabs[k].addEventListener('keydown', function (e) {
      var n = TAB_ORDER.length, to = null;
      if (e.key === 'ArrowRight') to = (i + 1) % n;
      else if (e.key === 'ArrowLeft') to = (i + n - 1) % n;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = n - 1;
      if (to === null) return;
      e.preventDefault();
      selectTab(TAB_ORDER[to], true);
    });
  });

  // Export / import
  $('#export-btn').addEventListener('click', function () {
    var data = JSON.stringify({ app: 'basket-run', version: 2, exportedAt: new Date().toISOString(), items: state.items, staples: state.staples, dinners: state.dinners, plan: state.plan }, null, 2);
    var url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    var a = el('a', { href: url, download: 'basket-run-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Exported ' + state.items.length + ' items, ' + state.staples.length + ' staples and ' + state.dinners.length + ' dinners');
  });
  $('#import-file').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(String(reader.result)); } catch (err) { toast('That file isn’t valid JSON'); return; }
      if (!data || (!Array.isArray(data.items) && !Array.isArray(data.staples) && !Array.isArray(data.dinners))) { toast('No Basket Run data found in that file'); return; }
      var items = cleanList(data.items, false), staples = cleanList(data.staples, true);
      var hasDinners = Array.isArray(data.dinners);
      var dinners = hasDinners ? cleanDinners(data.dinners) : state.dinners;
      var msg = 'Replace your list and staples with ' + items.length + ' items and ' + staples.length + ' staples' +
        (hasDinners ? ', and your dinners and week plan with ' + dinners.length + ' dinners' : '') + ' from this file?';
      askConfirm(msg, 'Replace', function () {
        state.items = items; state.staples = staples; state.editing = null;
        if (hasDinners) { state.dinners = dinners; state.plan = cleanPlan(data.plan, dinners); state.openDinner = null; }
        save(); render();
        toast('Imported ' + items.length + ' items and ' + staples.length + ' staples' + (hasDinners ? ' and ' + dinners.length + ' dinners' : ''));
      });
    };
    reader.onerror = function () { toast('Couldn’t read that file'); };
    reader.readAsText(file);
    e.target.value = '';
  });

  applyTheme();
  render();
})();
