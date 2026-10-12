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

  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    }
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function clampQty(q) { q = parseInt(q, 10); return isNaN(q) ? 1 : Math.min(999, Math.max(1, q)); }
  function tidy(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 80); }
  function same(a, b) { return a.toLowerCase() === b.toLowerCase(); }

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

  var state = {
    items: cleanList(store.get('br.items', []), false),
    staples: cleanList(store.get('br.staples', []), true),
    basketOpen: store.get('br.basketOpen', true) !== false,
    tab: 'list',
    editing: null
  };
  function save() {
    store.set('br.items', state.items);
    store.set('br.staples', state.staples);
    store.set('br.basketOpen', state.basketOpen);
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
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

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
  function parseQuick(text) {
    var t = tidy(text);
    var m = t.match(/^(\d{1,3})\s*(?:[x×]\s+)?(.+)$/i);
    if (m && /[a-z]/i.test(m[2])) return { qty: clampQty(m[1]), name: tidy(m[2]) };
    return { qty: 1, name: t };
  }

  var focusKey = null;
  function render() {
    var a = document.activeElement;
    var key = focusKey || (a && a.dataset ? a.dataset.key : null);
    focusKey = null;
    renderList();
    renderStaples();
    $('#list-count').textContent = state.items.filter(function (i) { return !i.checked; }).length;
    $('#staples-count').textContent = state.staples.length;
    if (key) {
      var target = document.querySelector('[data-key="' + key + '"]');
      if (target) target.focus();
    }
  }

  function stepper(obj) {
    var dec = function () { if (obj.qty > 1) { obj.qty--; save(); render(); } };
    var inc = function () { if (obj.qty < 999) { obj.qty++; save(); render(); } };
    return el('div', { class: 'stepper', role: 'group', 'aria-label': 'Quantity of ' + obj.name },
      el('button', { type: 'button', 'aria-label': 'Decrease ' + obj.name, 'aria-disabled': obj.qty <= 1 ? 'true' : null, 'data-key': 'dec-' + obj.id, onclick: dec }, icon('minus')),
      el('span', { class: 'qty', text: String(obj.qty) }),
      el('button', { type: 'button', 'aria-label': 'Increase ' + obj.name, 'data-key': 'inc-' + obj.id, onclick: inc }, icon('plus')));
  }

  function editRow(obj, kind) {
    var nameIn = el('input', { class: 'input', id: 'e-name', type: 'text', maxlength: '80', value: obj.name, required: true, 'data-key': 'edit-name' });
    var qtyIn = el('input', { class: 'input', id: 'e-qty', type: 'number', min: '1', max: '999', value: String(obj.qty), inputmode: 'numeric' });
    var catSel = el('select', { class: 'input', id: 'e-cat' });
    fillCatSelect(catSel, obj.cat, false);
    var back = (kind === 'item' ? 'edit-' : 'sedit-') + obj.id;
    function close() { state.editing = null; focusKey = back; render(); }
    var form = el('form', {
      class: 'edit', 'aria-label': 'Edit ' + obj.name,
      onsubmit: function (e) {
        e.preventDefault();
        var name = tidy(nameIn.value);
        if (!name) { nameIn.focus(); toast('Name can’t be empty'); return; }
        var list = kind === 'item' ? state.items : state.staples;
        var clash = list.some(function (x) { return x !== obj && same(x.name, name) && (kind === 'staple' || !x.checked) && !obj.checked; });
        if (clash) { toast(name + ' is already listed'); nameIn.focus(); return; }
        obj.name = name; obj.qty = clampQty(qtyIn.value); obj.cat = catSel.value;
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
    if (isEditing('item', it.id)) return editRow(it, 'item');
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
      var msg = done.length ? 'Everything is in the basket. Nice run!' : 'Your list is empty. Add something above, or re-add your weekly staples.';
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

  // Staples
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
      if (isEditing('staple', s.id)) { ul.appendChild(editRow(s, 'staple')); return; }
      var on = onList(s);
      ul.appendChild(el('li', { class: 'row' },
        el('div', { class: 'staple-info' }, el('span', { class: 'name-text', text: s.name }), el('span', { class: 'meta', text: '×' + s.qty + ' · ' + s.cat })),
        on ? el('span', { class: 'badge' }, icon('check'), 'On list')
          : el('button', {
            class: 'btn small primary', type: 'button', 'aria-label': 'Add ' + s.name + ' to list', 'data-key': 'sadd-' + s.id,
            onclick: function () { addStapleToList(s); save(); focusKey = 'sedit-' + s.id; render(); toast('Added ' + s.name + ' to ' + s.cat); }
          }, icon('plus'), 'Add'),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Edit staple ' + s.name, 'data-key': 'sedit-' + s.id, onclick: function () { startEdit('staple', s.id); } }, icon('edit')),
        el('button', {
          class: 'icon-btn del', type: 'button', 'aria-label': 'Remove staple ' + s.name,
          onclick: function () { state.staples = state.staples.filter(function (x) { return x !== s; }); save(); render(); $('#staple-name').focus(); toast('Removed staple ' + s.name); }
        }, icon('trash'))));
    });
  }

  $('#add-all').addEventListener('click', function () {
    var added = 0, skipped = 0;
    state.staples.forEach(function (s) { if (addStapleToList(s)) added++; else skipped++; });
    save(); render();
    toast('Added ' + added + ' staple' + (added === 1 ? '' : 's') + (skipped ? ', ' + skipped + ' already on the list' : ''));
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
  var tabs = { list: $('#tab-list'), staples: $('#tab-staples') };
  function selectTab(name, focus) {
    state.tab = name;
    Object.keys(tabs).forEach(function (k) {
      var on = k === name;
      tabs[k].setAttribute('aria-selected', String(on));
      tabs[k].tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    if (focus) tabs[name].focus();
  }
  Object.keys(tabs).forEach(function (k) {
    tabs[k].addEventListener('click', function () { selectTab(k); });
    tabs[k].addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        selectTab(k === 'list' ? 'staples' : 'list', true);
      }
    });
  });

  // Export / import
  $('#export-btn').addEventListener('click', function () {
    var data = JSON.stringify({ app: 'basket-run', version: 1, exportedAt: new Date().toISOString(), items: state.items, staples: state.staples }, null, 2);
    var url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    var a = el('a', { href: url, download: 'basket-run-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Exported ' + state.items.length + ' items and ' + state.staples.length + ' staples');
  });
  $('#import-file').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(String(reader.result)); } catch (err) { toast('That file isn’t valid JSON'); return; }
      if (!data || (!Array.isArray(data.items) && !Array.isArray(data.staples))) { toast('No Basket Run data found in that file'); return; }
      var items = cleanList(data.items, false), staples = cleanList(data.staples, true);
      if (!window.confirm('Replace your list and staples with ' + items.length + ' items and ' + staples.length + ' staples from this file?')) return;
      state.items = items; state.staples = staples; state.editing = null;
      save(); render();
      toast('Imported ' + items.length + ' items and ' + staples.length + ' staples');
    };
    reader.onerror = function () { toast('Couldn’t read that file'); };
    reader.readAsText(file);
    e.target.value = '';
  });

  applyTheme();
  render();
})();
