/* =====================================================================
   Booking demo (book.html) — design-only preview, nothing is sent.
   Pricing + currency come from site.js (window.TBH).
   Query options:  ?type=one|two|three|quote   ?guests=1..4   ?dest=founder|mosque|palace
   ===================================================================== */
(function(){
  'use strict';
  const form = document.getElementById('bookForm'); if (!form || !window.TBH) return;
  const { GROUP_AED, SOLO_AED, money, onPrices } = window.TBH;
  const $ = id => document.getElementById(id);

  const state = { date: null, type: 'one', guests: 2, destinations: ['Sheikh Zayed Grand Mosque'] };
  const typeNames = { one: 'Private Cultural Introduction · 1 outing', two: 'Abu Dhabi Across Your Stay · 2 outings', three: 'Signature Abu Dhabi Stay · 3 outings', quote: 'Three outings + after-tour activities · private quote' };
  const packageCounts = { one: 1, two: 2, three: 3, quote: 3 };
  const destMap = { founder: "The Founder's Memorial", mosque: 'Sheikh Zayed Grand Mosque', palace: 'Qasr Al Watan' };
  const calGrid = $('calGrid'), calMonth = $('calMonth'), prevBtn = $('calPrev'), nextBtn = $('calNext');
  const today = new Date(); today.setHours(0,0,0,0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  function renderCal(){
    calMonth.textContent = view.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    prevBtn.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    nextBtn.disabled = view >= new Date(today.getFullYear(), today.getMonth() + 11, 1);
    let html = ['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => `<span class="cal__dow" aria-hidden="true">${d}</span>`).join('');
    const offset = (view.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) html += '<span></span>';
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const dt = new Date(view.getFullYear(), view.getMonth(), d);
      const past = dt < today; const sel = state.date && dt.getTime() === state.date.getTime();
      html += `<button type="button" class="cal__day${dt.getTime() === today.getTime() ? ' is-today' : ''}" data-d="${d}" ${past ? 'disabled' : ''} aria-pressed="${sel}" aria-label="${fmt.format(dt)}${past ? ', unavailable' : ''}">${d}</button>`;
    }
    calGrid.innerHTML = html;
  }
  calGrid.addEventListener('click', e => {
    const b = e.target.closest('.cal__day'); if (!b || b.disabled) return;
    state.date = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d); renderCal(); renderSummary();
    calGrid.querySelector(`[data-d="${b.dataset.d}"]`).focus();
  });
  prevBtn.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
  nextBtn.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });

  const destBoxes = [...document.querySelectorAll('#destSelections input')];
  function syncDestinations(){
    destBoxes.forEach(b => { b.checked = state.destinations.includes(b.value); b.disabled = false; });
    $('destHelp').textContent = 'Select your preferred sites';
    $('destHint').textContent = 'These are preferences, not a fixed itinerary. Multiple outings take place across your stay. Hasher confirms destinations and dates.';
  }
  function setType(t){
    if (!packageCounts[t]) return;
    state.type = t;
    const r = $('t-' + t); if (r) r.checked = true;
    syncDestinations(); renderSummary();
  }
  document.querySelectorAll('input[name="type"]').forEach(r => r.addEventListener('change', () => setType(r.value)));
  destBoxes.forEach(box => box.addEventListener('change', () => {
    state.destinations = destBoxes.filter(b => b.checked).map(b => b.value);
    syncDestinations(); renderSummary();
  }));

  const gCount = $('gCount'), gMinus = $('gMinus'), gPlus = $('gPlus'), gNote = $('gNote');
  function renderGuests(){
    gCount.textContent = state.guests; gMinus.disabled = state.guests <= 1; gPlus.disabled = state.guests >= 4;
    gNote.textContent = state.guests === 1 ? 'solo guest — welcome' : state.guests === 4 ? 'guests (maximum)' : 'guests';
  }
  gMinus.addEventListener('click', () => { state.guests = Math.max(1, state.guests - 1); renderGuests(); renderSummary(); });
  gPlus.addEventListener('click', () => { state.guests = Math.min(4, state.guests + 1); renderGuests(); renderSummary(); });

  const activities = $('fActivities');
  activities.addEventListener('input', renderSummary);
  function renderSummary(){
    $('sDate').textContent = state.date ? fmt.format(state.date) : 'Choose first date';
    $('sType').textContent = typeNames[state.type];
    $('sDest').textContent = state.destinations.length ? state.destinations.join(', ') : 'Discuss with Hasher';
    $('sGuests').textContent = state.guests === 1 ? '1 guest (solo)' : state.guests + ' guests';
    $('sAddons').textContent = activities.value.trim() ? 'Quote requested' : 'None requested';
    const solo = state.guests === 1;
    $('typeHelp').textContent = solo ? 'Solo traveller' : 'Per private group · 2–4 guests';
    document.querySelectorAll('[data-choice-price]').forEach(el => {
      const k = el.dataset.choicePrice;
      if (solo) el.textContent = SOLO_AED[k] == null ? 'Solo price to be confirmed' : money(SOLO_AED[k]) + ' solo';
      else el.textContent = money(GROUP_AED[k], state.guests) + ' each';
    });
    const each = $('sEach'), total = $('sTotal');
    if (state.type === 'quote') { each.textContent = 'Private quotation'; total.textContent = ''; return; }
    if (solo) {
      const v = SOLO_AED[state.type];
      if (v == null) { each.innerHTML = 'Solo price <small>to be confirmed</small>'; total.textContent = ''; }
      else { each.innerHTML = money(v) + ' <small>solo</small>'; total.textContent = ''; }
      return;
    }
    const g = GROUP_AED[state.type];
    each.innerHTML = money(g, state.guests) + ' <small>per guest</small>';
    total.innerHTML = 'Group of ' + state.guests + ' · <b>' + money(g) + '</b> in total';
  }
  onPrices(renderSummary);

  const msg = $('sMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('fName').value.trim(), email = $('fEmail').value.trim();
    msg.className = 'summary__msg';
    if (!state.date) { msg.textContent = 'Please choose a date first.'; msg.classList.add('is-error'); return; }
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Please add your name and a valid email.'; msg.classList.add('is-error'); (name ? $('fEmail') : $('fName')).focus(); return; }
    msg.textContent = 'Preview only: no request was sent, no dates were reserved and no payment was taken. Other outing dates and inclusions must be confirmed with Hasher.';
    msg.classList.add('is-ok');
  });

  // Pre-selection from the links on the other pages
  const q = new URLSearchParams(location.search);
  if (q.get('dest') && destMap[q.get('dest')]) state.destinations = [destMap[q.get('dest')]];
  const g = parseInt(q.get('guests'), 10); if (g >= 1 && g <= 4) state.guests = g;
  if (packageCounts[q.get('type')]) state.type = q.get('type');
  const r = $('t-' + state.type); if (r) r.checked = true;

  syncDestinations(); renderCal(); renderGuests(); renderSummary();
})();
