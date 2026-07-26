/* App shell: routing, content loading, figure mounting, progress. */

import { PARTS, byId, indexOfId } from './parts.js';
import { progress, theme } from './state.js';
import { FIGURES } from './figures/index.js';
import { clearLoops } from './lib/anim.js';
import { h, $, $$ } from './lib/dom.js';

theme.apply();

const view = $('#view');
const railList = $('#rail-list');

/* ---------------- rail ---------------- */

function renderRail() {
  railList.innerHTML = '';
  const current = route().id;
  for (const p of PARTS) {
    const li = h('li', {
      class: 'rail__item',
      'data-active': String(p.id === current),
      'data-done': String(progress.has(p.id)),
    },
      h('a', { href: `#/${p.id}` },
        h('span', { class: 'rail__num', text: String(p.n).padStart(2, '0') }),
        h('span', { class: 'rail__title', text: p.title })
      )
    );
    railList.appendChild(li);
  }
}

function renderProgress() {
  const n = PARTS.filter((p) => progress.has(p.id)).length;
  $('#progress-label').textContent = `${n} / ${PARTS.length}`;
  $('#progress-fill').style.width = `${(n / PARTS.length) * 100}%`;
}

/* ---------------- routing ---------------- */

function route() {
  const raw = location.hash.replace(/^#\/?/, '').trim();
  return { id: raw || null };
}

async function render() {
  clearLoops();
  const { id } = route();
  view.innerHTML = '';
  view.classList.toggle('reader--wide', id === 'bench');

  try {
    if (!id) await renderCover();
    else {
      const part = byId(id);
      if (!part) { location.hash = '#/'; return; }
      await renderPart(part);
    }
  } catch (err) {
    renderError(err);
  }

  renderRail();
  renderProgress();
  $('#rail').removeAttribute('data-open');
  $('#rail-toggle').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function renderError(err) {
  const isFile = location.protocol === 'file:';
  view.appendChild(h('div', { class: 'aside', style: 'border-color:var(--spike)' },
    h('p', { html: isFile
      ? 'This guide loads its chapters as separate files, which browsers block when a page is opened directly from disk. Start the tiny bundled server instead — <code>python3 serve.py</code> — then open <code>http://localhost:8000</code>.'
      : `Could not load that part: <code>${String(err && err.message || err)}</code>` })
  ));
}

/* ---------------- cover ---------------- */

async function renderCover() {
  const html = await fetchText('content/00-cover.html');
  const wrap = h('div', { class: 'cover', html });
  view.appendChild(wrap);

  const mount = $('#index-mount', wrap);
  if (mount) {
    for (const p of PARTS) {
      mount.appendChild(h('a', {
        class: 'index__row', href: `#/${p.id}`, 'data-done': String(progress.has(p.id)),
      },
        h('span', { class: 'index__n', text: `PART ${String(p.n).padStart(2, '0')}` }),
        h('span', { class: 'index__t' }, p.title, h('small', { text: p.blurb })),
        h('span', { class: 'index__f', text: `${p.mins} min` })
      ));
    }
  }
  hydrate(wrap);
}

/* ---------------- a part ---------------- */

async function renderPart(part) {
  const html = await fetchText(part.file);
  const article = h('article', { 'data-part': part.id },
    h('div', { class: 'eyebrow', text: `Part ${String(part.n).padStart(2, '0')} · ${part.mins} min` }),
    h('h1', { class: 'part-title', text: part.title }),
    h('p', { class: 'lede', text: part.lede })
  );
  const bodyEl = h('div', { html });
  article.appendChild(bodyEl);
  view.appendChild(article);

  hydrate(bodyEl);

  // "mark complete" affordance
  const doneBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      progress.mark(part.id, !progress.has(part.id));
      syncDone();
    },
  });
  const syncDone = () => {
    const on = progress.has(part.id);
    doneBtn.textContent = on ? '✓ Marked complete' : 'Mark this part complete';
    doneBtn.classList.toggle('is-on', on);
    renderRail(); renderProgress();
  };
  syncDone();
  article.appendChild(h('div', { class: 'done' },
    h('span', { text: `End of Part ${part.n}` }), doneBtn
  ));

  // pager
  const i = indexOfId(part.id);
  const prev = i > 0 ? PARTS[i - 1] : null;
  const next = i < PARTS.length - 1 ? PARTS[i + 1] : null;
  article.appendChild(h('nav', { class: 'pager', 'aria-label': 'Part navigation' },
    h('a', { class: 'is-prev' + (prev ? '' : ' is-disabled'), href: prev ? `#/${prev.id}` : '#/' },
      h('span', { class: 'pager__dir', text: '← Previous' }),
      h('span', { class: 'pager__name', text: prev ? prev.title : 'Cover' })
    ),
    h('a', { class: 'is-next' + (next ? '' : ' is-disabled'), href: next ? `#/${next.id}` : '#/' },
      h('span', { class: 'pager__dir', text: 'Next →' }),
      h('span', { class: 'pager__name', text: next ? next.title : '—' })
    )
  ));
}

/* ---------------- hydration ---------------- */

/** Replace <div data-fig="name"> placeholders and wire checkpoints. */
function hydrate(root) {
  for (const slot of $$('[data-fig]', root)) {
    const name = slot.dataset.fig;
    const make = FIGURES[name];
    if (!make) {
      slot.replaceWith(h('div', { class: 'aside', text: `Figure "${name}" is not registered.` }));
      continue;
    }
    try {
      slot.replaceWith(make());
    } catch (err) {
      // one broken figure must never take the rest of the page with it
      console.error(`figure "${name}" failed`, err);
      slot.replaceWith(h('div', { class: 'aside', text: `Figure "${name}" failed to draw. The prose above stands on its own.` }));
    }
  }

  for (const check of $$('[data-check]', root)) {
    const answer = Number(check.dataset.answer);
    $$('.check__opt', check).forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (check.dataset.answered === 'true') return;
        check.dataset.answered = 'true';
        $$('.check__opt', check).forEach((b, j) => {
          if (j === answer) b.dataset.state = 'right';
          else if (j === idx) b.dataset.state = 'wrong';
        });
      });
    });
  }
}

async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.text();
}

/* ---------------- chrome ---------------- */

$('#theme-toggle').addEventListener('click', (e) => {
  const mode = theme.cycle();
  e.currentTarget.textContent = mode === 'system' ? 'Theme' : mode;
});

$('#reset-progress').addEventListener('click', () => {
  progress.reset();
  renderRail(); renderProgress();
  $$('.index__row').forEach((r) => r.setAttribute('data-done', 'false'));
  $$('.done .btn').forEach((b) => { b.textContent = 'Mark this part complete'; b.classList.remove('is-on'); });
});

$('#rail-toggle').addEventListener('click', (e) => {
  const rail = $('#rail');
  const open = rail.getAttribute('data-open') === 'true';
  rail.setAttribute('data-open', String(!open));
  e.currentTarget.setAttribute('aria-expanded', String(!open));
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const i = indexOfId(route().id);
  if (e.key === 'ArrowRight' && i < PARTS.length - 1) location.hash = `#/${PARTS[i + 1].id}`;
  if (e.key === 'ArrowLeft') location.hash = i > 0 ? `#/${PARTS[i - 1].id}` : '#/';
});

window.addEventListener('hashchange', render);
render();
