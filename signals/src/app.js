/*
 * The app shell: routing, chapter loading, figure mounting, progress.
 *
 * Prose lives in content/*.html as plain HTML and is written to stand
 * completely on its own. Figures are JavaScript, mounted into
 * <div data-fig="name"> placeholders. A figure that throws is caught and
 * replaced with a note — one broken drawing must never take a chapter
 * down with it.
 */

import { PARTS, BENCH, byId, indexOfId } from './parts.js';
import { progress, theme } from './state.js';
import { FIGURES } from './figures/index.js';
import { clearLoops } from './lib/anim.js';
import { stopAll } from './lib/audio.js';
import { h, $, $$, colorKey } from './lib/dom.js';

theme.apply();

const view = $('#view');
const railList = $('#rail-list');

/* ---------------- rail ---------------- */

function renderRail() {
  const current = route().id;
  railList.innerHTML = '';
  for (const p of PARTS) {
    railList.appendChild(h('li', {
      class: 'rail__item',
      'data-active': String(p.id === current),
      'data-done': String(progress.has(p.id)),
    },
      h('a', { href: `#/${p.id}` },
        h('span', { class: 'rail__num', text: String(p.n).padStart(2, '0') }),
        h('span', { class: 'rail__title', text: p.title })
      )
    ));
  }
  $('#rail-bench').setAttribute('data-active', String(current === BENCH.id));
}

function renderProgress() {
  const n = PARTS.filter((p) => progress.has(p.id)).length;
  $('#progress-label').textContent = `${n} / ${PARTS.length}`;
  $('#progress-fill').style.width = `${(n / PARTS.length) * 100}%`;
}

/* ---------------- routing ---------------- */

function route() {
  return { id: location.hash.replace(/^#\/?/, '').trim() || null };
}

async function render() {
  clearLoops();
  stopAll();
  const { id } = route();
  view.innerHTML = '';

  try {
    if (!id) await renderCover();
    else if (id === BENCH.id) await renderBench();
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
  $('#rail').setAttribute('data-open', 'false');
  $('#rail-toggle').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderError(err) {
  const isFile = location.protocol === 'file:';
  view.appendChild(h('div', { class: 'aside', 'data-label': 'Could not load' },
    h('p', {
      html: isFile
        ? 'This guide loads its chapters as separate files, and browsers block that when a page is opened straight off disk. Start the bundled server instead — <code>python3 serve.py</code> — then open <code>http://localhost:8000</code>.'
        : `Something went wrong loading that part: <code>${String((err && err.message) || err)}</code>`,
    })
  ));
}

async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.text();
}

/* ---------------- cover ---------------- */

async function renderCover() {
  const wrap = h('div', { class: 'cover reader', html: await fetchText('content/00-cover.html') });
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
    mount.appendChild(h('a', { class: 'index__row', href: `#/${BENCH.id}` },
      h('span', { class: 'index__n', text: 'TOOL' }),
      h('span', { class: 'index__t' }, BENCH.title, h('small', { text: BENCH.lede })),
      h('span', { class: 'index__f', text: 'open' })
    ));
  }
  hydrate(wrap);
}

/* ---------------- a part ---------------- */

async function renderPart(part) {
  const html = await fetchText(part.file);
  const body = h('div', { html });
  const article = h('article', { class: 'reader', 'data-part': part.id },
    h('div', { class: 'eyebrow', text: `Part ${String(part.n).padStart(2, '0')} · ${part.mins} min read` }),
    h('h1', { class: 'part-title', text: part.title }),
    h('p', { class: 'lede', text: part.lede }),
    body
  );
  view.appendChild(article);
  hydrate(body);

  const doneBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => { progress.mark(part.id, !progress.has(part.id)); syncDone(); },
  });
  const syncDone = () => {
    const on = progress.has(part.id);
    doneBtn.textContent = on ? '✓ marked complete' : 'mark this part complete';
    doneBtn.classList.toggle('is-on', on);
    renderRail(); renderProgress();
  };
  syncDone();
  article.appendChild(h('div', { class: 'done' }, h('span', { text: `End of Part ${part.n}` }), doneBtn));

  const i = indexOfId(part.id);
  const prev = i > 0 ? PARTS[i - 1] : null;
  const next = i < PARTS.length - 1 ? PARTS[i + 1] : BENCH;
  article.appendChild(h('nav', { class: 'pager', 'aria-label': 'Part navigation' },
    h('a', { class: 'is-prev' + (prev ? '' : ''), href: prev ? `#/${prev.id}` : '#/' },
      h('span', { class: 'pager__dir', text: '← Previous' }),
      h('span', { class: 'pager__name', text: prev ? prev.title : 'Cover' })
    ),
    h('a', { class: 'is-next', href: `#/${next.id}` },
      h('span', { class: 'pager__dir', text: 'Next →' }),
      h('span', { class: 'pager__name', text: next.title })
    )
  ));
}

/* ---------------- the bench ---------------- */

async function renderBench() {
  const html = await fetchText(BENCH.file);
  const body = h('div', { html });
  const article = h('article', { class: 'reader', 'data-part': BENCH.id },
    h('div', { class: 'eyebrow', text: 'The tool · no guard rails' }),
    h('h1', { class: 'part-title', text: BENCH.title }),
    h('p', { class: 'lede', text: BENCH.lede }),
    body
  );
  view.appendChild(article);
  hydrate(body);
  article.appendChild(h('nav', { class: 'pager', 'aria-label': 'Navigation' },
    h('a', { class: 'is-prev', href: `#/${PARTS[PARTS.length - 1].id}` },
      h('span', { class: 'pager__dir', text: '← Previous' }),
      h('span', { class: 'pager__name', text: PARTS[PARTS.length - 1].title })
    ),
    h('a', { class: 'is-next', href: '#/' },
      h('span', { class: 'pager__dir', text: 'Next →' }),
      h('span', { class: 'pager__name', text: 'Cover' })
    )
  ));
}

/* ---------------- hydration ---------------- */

function hydrate(root) {
  for (const slot of $$('[data-fig]', root)) {
    const name = slot.dataset.fig;
    const make = FIGURES[name];
    if (!make) {
      slot.replaceWith(h('div', { class: 'aside', 'data-label': 'Missing figure', text: `Figure "${name}" is not registered.` }));
      continue;
    }
    try {
      slot.replaceWith(make());
    } catch (err) {
      console.error(`figure "${name}" failed`, err);
      slot.replaceWith(h('div', { class: 'aside', 'data-label': 'Figure unavailable',
        text: 'This drawing failed to render. The prose around it is written to stand on its own.' }));
    }
  }

  for (const slot of $$('[data-key]', root)) {
    slot.replaceWith(colorKey([
      ['in', 'x(t) — what goes in'],
      ['out', 'y(t) — what comes out'],
      ['sys', 'the system itself'],
      ['tone', 'one pure tone'],
    ]));
  }

  for (const check of $$('[data-check]', root)) {
    const answer = Number(check.dataset.answer);
    const opts = $$('.check__opt', check);
    opts.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (check.dataset.answered === 'true') return;
        check.dataset.answered = 'true';
        opts.forEach((b, j) => {
          if (j === answer) b.dataset.state = 'right';
          else if (j === idx) b.dataset.state = 'wrong';
        });
      });
    });
  }
}

/* ---------------- chrome ---------------- */

$('#theme-toggle').addEventListener('click', (e) => {
  const mode = theme.cycle();
  e.currentTarget.textContent = mode === 'system' ? 'theme' : mode;
});

$('#reset-progress').addEventListener('click', () => {
  progress.reset();
  renderRail(); renderProgress();
  $$('.index__row').forEach((r) => r.setAttribute('data-done', 'false'));
  $$('.done .btn').forEach((b) => { b.textContent = 'mark this part complete'; b.classList.remove('is-on'); });
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
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
  const i = indexOfId(route().id);
  if (i < 0) return;
  if (e.key === 'ArrowRight' && i < PARTS.length - 1) location.hash = `#/${PARTS[i + 1].id}`;
  if (e.key === 'ArrowLeft') location.hash = i > 0 ? `#/${PARTS[i - 1].id}` : '#/';
});

window.addEventListener('hashchange', render);
render();
