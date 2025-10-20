// load_projects.js
(function () {
  // ---- helpers ----
  const log = (...a) => console.log('[projects]', ...a);
  const error = (...a) => console.error('[projects]', ...a);
  const normalize = s => (s ?? '').replace(/^\uFEFF/, '').trim();

  // run after DOM
  document.addEventListener('DOMContentLoaded', () => loadProjects('project.csv'));

  async function loadProjects(csvPath) {
    if (!window.Papa) { error('PapaParse not loaded (script order?)'); return; }

    let csvText = '';
    try {
      const res = await fetch(csvPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      csvText = await res.text();
    } catch (e) {
      error('Fetch failed for', csvPath, e);
      console.info('[projects][tip] Start a local server (e.g., `python3 -m http.server` or `npx serve .`)');
      return;
    }

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => normalize(h),
      transform: v => typeof v === 'string' ? v.trim() : v
    });
    if (parsed.errors?.length) error('PapaParse errors:', parsed.errors);

    let rows = (parsed.data || []).map(r => {
      const o = {};
      Object.keys(r).forEach(k => o[normalize(k)] = r[k]);
      return o;
    });

    log('Rows parsed:', rows.length);
    const req = ['topic','project_card_name','project_card_img_path','project_card_content'];
    if (!rows.length || req.some(h => !(h in rows[0]))) {
      error('Bad/missing headers. Expected:', req, 'Got:', rows[0] && Object.keys(rows[0]));
      return;
    }

    // group by topic
    const byTopic = {};
    for (const r of rows) {
      const t = normalize(r.topic);
      if (!t) continue;
      (byTopic[t] ??= []).push(r);
    }
    log('Topics:', Object.keys(byTopic));

    // render
    const container = document.querySelector('.project_list_container');
    if (!container) { error('Missing .project_list_container'); return; }

    // clear shells
    document.querySelectorAll('.project_list').forEach(list => list.innerHTML = '');

    for (const [topic, items] of Object.entries(byTopic)) {
      let listEl = document.querySelector(`.project_list[topic="${CSS?.escape ? CSS.escape(topic) : topic}"]`);
      if (!listEl) {
        listEl = document.createElement('div');
        listEl.className = 'project_list';
        listEl.setAttribute('topic', topic);
        container.appendChild(listEl);
      }
      renderCards(listEl, items);
    }

    // post-check
    document.querySelectorAll('.project_list').forEach(list => {
      const t = list.getAttribute('topic');
      const n = list.children.length;
      if (!n) console.warn('[projects][warn] Topic has 0 items:', JSON.stringify(t));
      else log(`Rendered ${n} cards for "${t}"`);
    });
  }

  function renderCards(container, items) {
    const frag = document.createDocumentFragment();
    for (const { project_card_name, project_card_img_path, project_card_content } of items) {
      const card = div('project_card');
      const name = div('project_card_name', project_card_name || '');
      const img = div('project_card_img');
      if (project_card_img_path) img.style.backgroundImage = `url("${project_card_img_path}")`;
      const content = div('project_card_content', project_card_content || '');
      card.append(name, img, content);
      frag.appendChild(card);
    }
    container.appendChild(frag);
  }

  function div(cls, text) {
    const el = document.createElement('div');
    el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
})();
