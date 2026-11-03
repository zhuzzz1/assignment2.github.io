/* ==========================================================
   教材检索 — 逻辑脚本
   功能：全书关键词检索 / 按教材筛选 / 按章节定位 / 结果高亮
   ========================================================== */

/* 把教材拍平成可检索的段落数组 */
function flattenBooks() {
  const rows = [];
  BOOKS.forEach(b => {
    b.chapters.forEach(ch => {
      ch.secs.forEach(s => {
        rows.push({
          bookId: b.id, book: b.name, author: b.author, course: b.course, color: b.color,
          chNo: ch.no, chName: ch.name, title: s.t, content: s.c, p: s.p,
          text: (b.name + b.author + b.course + '第' + ch.no + '章' + ch.name + s.t + s.c).toLowerCase()
        });
      });
    });
  });
  return rows;
}
const BOOK_ROWS = flattenBooks();

/* 搜索打分：知识点的内容命中权重最高 */
function searchBooks(kw) {
  const words = (kw || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return BOOK_ROWS.map(r => {
    let score = 0, hit = 0;
    words.forEach(w => {
      let s = 0;
      if (r.title.toLowerCase().includes(w)) s += 12;
      if (r.content.toLowerCase().includes(w)) s += 6;
      if (r.chName.toLowerCase().includes(w)) s += 3;
      if ((r.book + r.author + r.course).toLowerCase().includes(w)) s += 2;
      if (s) hit++;
      score += s;
    });
    return { r, score, hit };
  }).filter(x => x.hit)
    .sort((a, b) => b.hit - a.hit || b.score - a.score)
    .map(x => x.r);
}

function initBookSearch() {
  const wrap = document.querySelector('[data-book-results]');
  if (!wrap) return;

  const input = document.querySelector('[data-book-input]');
  const chips = document.querySelectorAll('[data-book-filter]');
  const stats = document.querySelector('[data-book-stats]');
  const emptyEl = document.querySelector('[data-book-empty]');
  const hintEl = document.querySelector('[data-book-hint]');
  const chWrap = document.querySelector('[data-chapter-nav]');

  let state = { q: '', book: 'all' };
  const params = new URLSearchParams(location.search);
  if (params.get('q')) state.q = params.get('q');
  if (params.get('book')) state.book = params.get('book');
  if (input) input.value = state.q;

  /* 左侧教材目录 */
  function renderBooks() {
    const list = document.querySelector('[data-book-nav]');
    if (!list) return;
    list.innerHTML = BOOKS.map(b => `
      <li class="bookitem ${state.book === b.id ? 'active' : ''}" data-booksel="${b.id}">
        <span class="bookdot" style="background:${b.color}"></span>
        <div>
          <strong>${esc(b.name)}</strong>
          <em>${esc(b.author)} · ${esc(b.edition)}</em>
        </div>
        <span class="bookcount">${b.chapters.length}章</span>
      </li>`).join('');
    list.querySelectorAll('[data-booksel]').forEach(el => {
      el.addEventListener('click', () => {
        state.book = state.book === el.dataset.booksel ? 'all' : el.dataset.booksel;
        apply();
        renderBooks();
        renderChapters();
      });
    });
  }

  /* 章节快捷跳转（跟随当前选中教材） */
  function renderChapters() {
    if (!chWrap) return;
    const bs = state.book === 'all' ? BOOKS : BOOKS.filter(b => b.id === state.book);
    chWrap.innerHTML = bs.map(b => `
      <div class="chnav-group">
        <p class="chnav-book" style="color:${b.color}">${esc(b.name)}</p>
        <div class="chnav-list">
          ${b.chapters.map(ch => `<button class="chnav-item" data-ch="${b.id}-${ch.no}">第${ch.no}章 ${esc(ch.name)}</button>`).join('')}
        </div>
      </div>`).join('');
    chWrap.querySelectorAll('[data-ch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [bid, no] = btn.dataset.ch.split('-');
        const b = BOOKS.find(x => x.id === bid);
        const ch = b.chapters.find(c => c.no === no);
        // 点击章节 → 直接列出该章全部知识点
        state.book = bid; state.q = '';
        if (input) input.value = '';
        renderBooks();
        showChapter(b, ch);
      });
    });
  }

  function showChapter(b, ch) {
    hintEl && (hintEl.style.display = 'none');
    emptyEl && (emptyEl.style.display = 'none');
    stats.innerHTML = `《${esc(b.name)}》第${ch.no}章 · ${esc(ch.name)} <b>${ch.secs.length}</b> 个知识点`;
    wrap.innerHTML = ch.secs.map(s => card({
      book: b.name, author: b.author, color: b.color, chNo: ch.no, chName: ch.name,
      title: s.t, content: s.c, p: s.p
    }, '')).join('');
    initReveal();
  }

  function card(r, kw) {
    return `
    <article class="bk-card reveal" style="--bk:${r.color}">
      <div class="bk-card-head">
        <span class="bk-book" style="background:${r.color}1a;color:${r.color}">${esc(r.book)}</span>
        <span class="bk-loc">第${r.chNo}章 · ${esc(r.chName)}</span>
      </div>
      <h3>${highlight(r.title, kw)}</h3>
      <p>${highlight(r.content, kw)}</p>
      <div class="bk-foot">
        <span>${esc(r.author)}</span>
        <span class="bk-page">${esc(r.p || '')}</span>
        <a href="list.html?q=${encodeURIComponent(r.title)}">查看相关笔记 ${ICONS.arrow}</a>
      </div>
    </article>`;
  }

  function apply() {
    let rows = BOOK_ROWS;
    if (state.book !== 'all') rows = rows.filter(r => r.bookId === state.book);

    chips.forEach(c => c.classList.toggle('active', c.dataset.bookFilter === state.book));

    if (!state.q.trim()) {
      hintEl && (hintEl.style.display = 'block');
      emptyEl && (emptyEl.style.display = 'none');
      wrap.innerHTML = '';
      stats.innerHTML = state.book === 'all'
        ? `共收录 <b>${BOOKS.length}</b> 本教材 / <b>${BOOK_ROWS.length}</b> 个知识点`
        : `已选中《${esc(BOOKS.find(b => b.id === state.book).name)}》，点击左侧章节或输入关键词开始检索`;
      return;
    }

    const found = searchBooks(state.q).filter(r => state.book === 'all' || r.bookId === state.book);
    hintEl && (hintEl.style.display = 'none');
    emptyEl && (emptyEl.style.display = found.length ? 'none' : 'block');
    stats.innerHTML = `关键词「<b>${esc(state.q)}</b>」共命中 <b>${found.length}</b> 个知识点`;
    wrap.innerHTML = found.map(r => card(r, state.q)).join('');
    initReveal();
  }

  chips.forEach(c => c.addEventListener('click', () => {
    state.book = c.dataset.bookFilter;
    renderBooks(); renderChapters(); apply();
  }));

  if (input) {
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = input.value; apply(); }, 160);
    });
  }

  // 推荐关键词
  document.querySelectorAll('[data-kw]').forEach(el => {
    el.addEventListener('click', () => {
      state.q = el.dataset.kw; state.book = 'all';
      if (input) input.value = state.q;
      renderBooks(); renderChapters(); apply();
      window.scrollTo({ top: document.querySelector('[data-book-results]').offsetTop - 120, behavior: 'smooth' });
    });
  });

  renderBooks();
  renderChapters();
  apply();
}

document.addEventListener('DOMContentLoaded', initBookSearch);
