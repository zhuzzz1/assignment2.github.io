/* ==========================================================
   个人知识库 — 公共交互脚本
   1) 导航滚动渐变  2) 移动端折叠导航  3) 进场动画
   4) 图片懒加载    5) 站内搜索高亮    6) 回到顶部
   ========================================================== */

/* ---------- 图标 ---------- */
const ICONS = {
  book: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  layout: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  code: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  cup: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h2a2 2 0 0 1 0 4h-2M7 5H5a2 2 0 0 0 0 4h2"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  top: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
};

/* ---------- 工具函数 ---------- */
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${y}.${m}.${day}`;
}

function tagClass(cat) {
  return (CATEGORIES[cat] || {}).cls || 'tag-plain';
}

function catName(cat) {
  return (CATEGORIES[cat] || {}).name || '未分类';
}

function cover(cat, title) {
  /* 纯 CSS 生成的渐变封面，无外部图片依赖；data-src 用于演示懒加载 */
  return `<div class="cover cover-${cat}" data-cat="${cat}"><span>${esc(title.slice(0, 1))}</span></div>`;
}

/* ---------- 导航：滚动渐变 ---------- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // 非首页（没有 hero）直接实色
  const hasHero = document.querySelector('[data-hero]');

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (hasHero) {
      navbar.classList.toggle('scrolled', y > 40);
    }
    const toTop = document.querySelector('.to-top');
    if (toTop) toTop.classList.toggle('show', y > 420);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 移动端折叠
  const burger = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', e => {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        links.classList.remove('open');
        burger.classList.remove('open');
      }
    });
  }

  // 导航搜索：回车跳转列表页
  const navInput = document.querySelector('.nav-search input');
  if (navInput) {
    navInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && navInput.value.trim()) {
        location.href = 'list.html?q=' + encodeURIComponent(navInput.value.trim());
      }
    });
  }

  // 回到顶部
  const toTop = document.querySelector('.to-top');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- 进场动画 + 图片懒加载 ---------- */
let io = null;
function initReveal() {
  const items = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
    return;
  }
  if (!io) {
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  items.forEach(el => io.observe(el));
}

function initLazy() {
  const imgs = document.querySelectorAll('img[data-src]');
  if (!imgs.length) return;
  const load = img => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.addEventListener('load', () => img.classList.add('loaded'));
  };
  if (!('IntersectionObserver' in window)) { imgs.forEach(load); return; }
  const ob = new IntersectionObserver(es => {
    es.forEach(en => {
      if (en.isIntersecting) { load(en.target); ob.unobserve(en.target); }
    });
  }, { rootMargin: '120px' });
  imgs.forEach(i => ob.observe(i));
}

/* ---------- 搜索：建索引 + 打分 + 高亮 ---------- */
function buildIndex(note) {
  return [
    note.title, note.intro, note.tags.join(' '),
    catName(note.cat),
    note.body.map(b => b[0] + ' ' + b[1]).join(' ')
  ].join(' ').toLowerCase();
}

function searchNotes(keyword) {
  const kw = (keyword || '').trim().toLowerCase();
  if (!kw) return [];
  const words = kw.split(/\s+/).filter(Boolean);
  return NOTES.map(n => {
    const title = n.title.toLowerCase();
    const tags = n.tags.join(' ').toLowerCase() + catName(n.cat).toLowerCase();
    const intro = n.intro.toLowerCase();
    const body = buildIndex(n);
    let score = 0, hit = 0;
    words.forEach(w => {
      let s = 0;
      if (title.includes(w)) s += 10;
      if (tags.includes(w)) s += 5;
      if (intro.includes(w)) s += 3;
      if (body.includes(w)) s += 1;
      if (s > 0) hit++;
      score += s;
    });
    return { note: n, score, hit };
  }).filter(r => r.hit > 0)
    .sort((a, b) => b.hit - a.hit || b.score - a.score || b.note.date.localeCompare(a.note.date))
    .map(r => r.note);
}

function highlight(text, keyword) {
  const safe = esc(text);
  const kw = (keyword || '').trim();
  if (!kw) return safe;
  const words = kw.split(/\s+/).filter(Boolean)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  if (!words.length) return safe;
  return safe.replace(new RegExp('(' + words.join('|') + ')', 'gi'), '<mark>$1</mark>');
}

/* ---------- 笔记卡片（列表用） ---------- */
function noteCard(n, kw = '') {
  return `
  <article class="note-card hover-card reveal">
    <a class="note-cover" href="detail.html?id=${n.id}" aria-label="${esc(n.title)}">
      ${cover(n.cat, n.title)}
    </a>
    <div class="note-body">
      <div class="note-meta">
        <span class="tag ${tagClass(n.cat)}">${catName(n.cat)}</span>
        <time datetime="${n.date}">${fmtDate(n.date)}</time>
        <span class="dot">·</span><span>${n.read} 分钟</span>
      </div>
      <h3 class="note-title"><a href="detail.html?id=${n.id}">${highlight(n.title, kw)}</a></h3>
      <p class="note-intro">${highlight(n.intro, kw)}</p>
      <div class="note-tags">
        ${n.tags.map(t => `<span class="tag tag-plain">#${esc(t)}</span>`).join('')}
      </div>
      <a class="note-more" href="detail.html?id=${n.id}">阅读全文 ${ICONS.arrow}</a>
    </div>
  </article>`;
}

/* ---------- 首页：分类卡片 / 最新笔记 / 公告 ---------- */
function renderHome() {
  const catWrap = document.querySelector('[data-cats]');
  if (catWrap) {
    catWrap.innerHTML = Object.entries(CATEGORIES).map(([key, c], i) => {
      const count = NOTES.filter(n => n.cat === key).length;
      return `
      <a class="cat-card hover-card reveal" href="list.html?cat=${key}" style="transition-delay:${i * 60}ms">
        <div class="cat-icon cat-${key}">${ICONS[c.icon] || ICONS.book}</div>
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
        <div class="cat-foot">
          <span class="cat-count">${count} 篇笔记</span>
          <span class="cat-go">${ICONS.arrow}</span>
        </div>
        <span class="cat-bar cat-bar-${key}"></span>
      </a>`;
    }).join('');
  }

  const latestWrap = document.querySelector('[data-latest]');
  if (latestWrap) {
    latestWrap.innerHTML = LATEST.map(n => `
      <a class="latest-item reveal" href="detail.html?id=${n.id}">
        <div class="latest-date"><strong>${n.date.slice(8, 10)}</strong><span>${n.date.slice(0, 7).replace('-', '.')}</span></div>
        <div class="latest-main">
          <h4>${esc(n.title)}</h4>
          <p>${esc(n.intro)}</p>
          <div class="note-meta">
            <span class="tag ${tagClass(n.cat)}">${catName(n.cat)}</span>
            ${n.tags.slice(0, 2).map(t => `<span class="tag tag-plain">#${esc(t)}</span>`).join('')}
          </div>
        </div>
        <span class="latest-arrow">${ICONS.arrow}</span>
      </a>`).join('');
  }

  const noticeWrap = document.querySelector('[data-notice]');
  if (noticeWrap) {
    noticeWrap.innerHTML = NOTICES.map((t, i) => `
      <li class="notice-item reveal" style="transition-delay:${i * 70}ms">
        <span class="notice-dot"></span><span>${esc(t)}</span>
      </li>`).join('');
  }

  const stat = document.querySelectorAll('[data-count]');
  stat.forEach(el => {
    const key = el.dataset.count;
    el.textContent = key === 'all' ? NOTES.length : NOTES.filter(n => n.cat === key).length;
  });
}

/* ---------- 分类页：四大分类详情 ---------- */
function renderCategory() {
  const wrap = document.querySelector('[data-catlist]');
  if (!wrap) return;
  wrap.innerHTML = Object.entries(CATEGORIES).map(([key, c], i) => {
    const list = NOTES.filter(n => n.cat === key).sort((a, b) => b.date.localeCompare(a.date));
    return `
    <section class="cat-block reveal" id="${key}">
      <div class="cat-block-head">
        <div class="cat-icon cat-${key}">${ICONS[c.icon]}</div>
        <div class="cat-block-title">
          <h2>${c.name}<span class="cat-en">${c.en}</span></h2>
          <p>${c.desc}</p>
        </div>
        <a class="cat-block-link" href="list.html?cat=${key}">查看全部 ${list.length} 篇 ${ICONS.arrow}</a>
      </div>
      <ul class="cat-note-list">
        ${list.slice(0, 4).map(n => `
          <li>
            <a href="detail.html?id=${n.id}">
              <span class="cnl-dot cat-dot-${key}"></span>
              <span class="cnl-title">${esc(n.title)}</span>
              <span class="tag tag-plain">${esc(n.tags[0])}</span>
              <time>${fmtDate(n.date)}</time>
            </a>
          </li>`).join('')}
      </ul>
      <div class="cat-progress"><span class="cat-progress-inner cat-bar-${key}" style="width:${Math.min(100, list.length * 18)}%"></span>
        <em>${list.length} 篇 / 目标 6 篇</em>
      </div>
    </section>`;
  }).join('');
}

/* ---------- 列表页：筛选 + 搜索 + 排序 ---------- */
function renderList() {
  const wrap = document.querySelector('[data-list]');
  if (!wrap) return;
  const params = new URLSearchParams(location.search);
  let state = {
    cat: params.get('cat') || 'all',
    q: params.get('q') || '',
    sort: 'new'
  };
  const input = document.querySelector('[data-search-input]');
  const chips = document.querySelectorAll('[data-filter]');
  const countEl = document.querySelector('[data-result-count]');
  const emptyEl = document.querySelector('[data-empty]');
  const sortSel = document.querySelector('[data-sort]');

  if (input) input.value = state.q;

  function apply() {
    let list = NOTES.slice();
    if (state.cat !== 'all') list = list.filter(n => n.cat === state.cat);
    if (state.q.trim()) {
      const found = searchNotes(state.q);
      const ids = new Set(found.map(n => n.id));
      list = list.filter(n => ids.has(n.id));
      list.sort((a, b) => found.findIndex(n => n.id === a.id) - found.findIndex(n => n.id === b.id));
    } else if (state.sort === 'new') {
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else if (state.sort === 'old') {
      list.sort((a, b) => a.date.localeCompare(b.date));
    } else if (state.sort === 'hot') {
      list.sort((a, b) => b.read - a.read);
    }

    wrap.innerHTML = list.map(n => noteCard(n, state.q)).join('');
    if (countEl) countEl.textContent = list.length;
    if (emptyEl) emptyEl.style.display = list.length ? 'none' : 'block';
    chips.forEach(c => c.classList.toggle('active', c.dataset.filter === state.cat));
    initReveal();
  }

  chips.forEach(c => c.addEventListener('click', () => {
    state.cat = c.dataset.filter;
    /* 只在 http(s) 下更新地址栏，本地 file:// 打开时不写入历史，避免安全限制报错 */
    try {
      if (location.protocol.startsWith('http')) {
        history.replaceState(null, '', 'list.html' + (state.cat === 'all' ? '' : '?cat=' + state.cat));
      }
    } catch (e) { /* 忽略：不影响筛选功能 */ }
    apply();
  }));

  if (input) {
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = input.value; apply(); }, 180);
    });
  }
  const clearBtn = document.querySelector('[data-search-clear]');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (input) input.value = '';
    state.q = ''; apply(); input && input.focus();
  });
  if (sortSel) sortSel.addEventListener('change', () => { state.sort = sortSel.value; apply(); });

  apply();
}

/* ---------- 笔记详情页 ---------- */
function renderDetail() {
  const page = document.querySelector('[data-detail]');
  if (!page) return;
  const id = new URLSearchParams(location.search).get('id');
  const n = NOTES.find(x => x.id === id) || NOTES[0];
  const related = NOTES.filter(x => x.cat === n.cat && x.id !== n.id).slice(0, 3);
  const idx = NOTES.indexOf(n);

  document.title = n.title + ' | 我的个人知识库';

  page.innerHTML = `
  <div class="detail-header reveal">
    <nav class="breadcrumb" aria-label="面包屑">
      <a href="index.html">首页</a><span>/</span>
      <a href="category.html#${n.cat}">${catName(n.cat)}</a><span>/</span>
      <em>正文</em>
    </nav>
    <span class="tag ${tagClass(n.cat)}">${catName(n.cat)}</span>
    <h1>${esc(n.title)}</h1>
    <p class="detail-intro">${esc(n.intro)}</p>
    <div class="detail-meta">
      <span>📅 ${fmtDate(n.date)}</span>
      <span>⏱ 约 ${n.read} 分钟</span>
      <span>✍ 朱悦欣</span>
      <span>🏷 ${n.tags.map(t => '#' + t).join(' ')}</span>
    </div>
  </div>

  <div class="detail-layout">
    <article class="detail-article reveal">
      ${n.body.map(([h, p], i) => `
        <section class="art-sec">
          <h2><i>${String(i + 1).padStart(2, '0')}</i>${esc(h)}</h2>
          <p>${esc(p)}</p>
        </section>`).join('')}

      <div class="art-tags">
        ${n.tags.map(t => `<a class="tag ${tagClass(n.cat)}" href="list.html?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}
      </div>

      <div class="art-refs">
        <h3>参考与延伸</h3>
        <ul>${n.refs.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      </div>

      <div class="art-nav">
        ${idx > 0 ? `<a class="art-nav-item" href="detail.html?id=${NOTES[idx - 1].id}"><span>← 上一篇</span><strong>${esc(NOTES[idx - 1].title)}</strong></a>` : '<span></span>'}
        ${idx < NOTES.length - 1 ? `<a class="art-nav-item next" href="detail.html?id=${NOTES[idx + 1].id}"><span>下一篇 →</span><strong>${esc(NOTES[idx + 1].title)}</strong></a>` : '<span></span>'}
      </div>
    </article>

    <aside class="detail-side">
      <div class="side-card reveal">
        <h4>本文目录</h4>
        <ul class="toc">
          ${n.body.map(([h], i) => `<li><a href="#sec${i}">${esc(h)}</a></li>`).join('')}
        </ul>
      </div>
      <div class="side-card reveal">
        <h4>相关笔记</h4>
        <ul class="side-rel">
          ${related.length ? related.map(r => `<li><a href="detail.html?id=${r.id}"><span class="tag ${tagClass(r.cat)}">${catName(r.cat)}</span>${esc(r.title)}</a></li>`).join('')
      : '<li class="side-empty">该分类暂无其他笔记</li>'}
        </ul>
      </div>
      <div class="side-card side-tip reveal">
        <h4>笔记说明</h4>
        <p>本篇为课程学习与实训整理的原创笔记，部分案例来自课堂讨论与个人项目实践，转载请注明出处。</p>
      </div>
    </aside>
  </div>`;

  // 给正文小节加 id，供目录跳转
  document.querySelectorAll('.art-sec').forEach((s, i) => s.id = 'sec' + i);

  // 目录高亮
  const tocLinks = document.querySelectorAll('.toc a');
  const secs = document.querySelectorAll('.art-sec');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const ob = new IntersectionObserver(es => {
      es.forEach(en => {
        if (en.isIntersecting) {
          tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-90px 0px -60% 0px' });
    secs.forEach(s => ob.observe(s));
  }

  // 阅读进度条
  const bar = document.querySelector('.read-progress');
  if (bar) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = Math.min(100, (window.scrollY / Math.max(1, h)) * 100) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }
}

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderCategory();
  renderList();
  renderDetail();
  initNavbar();
  initReveal();
  initLazy();
});
