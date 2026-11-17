/* ==========================================================
   个人博客 — 渲染与交互脚本
   依赖：blog.js（数据）、main.js（工具函数与公共交互）
   ========================================================== */

/* ---------- 图标补充 ---------- */
const BLOG_ICONS = {
  pen: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  eye: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  fire: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 1.072-.424 2.5-2 2.5-4 3.5 2 6.5 4.5 6.5 9a6.5 6.5 0 1 1-13 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  fresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
};

function blogCat(key) {
  return BLOG_CATS[key] || { name: "未分类", cls: "tag-plain" };
}

function fmtCN(d) {
  const [y, m, day] = d.split("-");
  return `${y} 年 ${parseInt(m)} 月 ${parseInt(day)} 日`;
}

/* ---------- 文章卡片 ---------- */
function postCard(p) {
  return `
  <article class="post-card hover-card reveal">
    <a class="post-cover" href="detail.html?id=${p.id}&t=blog" aria-label="${esc(p.title)}">
      <img src="${p.cover}" alt="${esc(p.title)} 封面" loading="lazy">
    </a>
    <div class="post-body">
      <div class="post-meta">
        <a class="tag ${blogCat(p.cat).cls}" href="index.html?cat=${p.cat}">${blogCat(p.cat).name}</a>
        <time datetime="${p.date}">${fmtCN(p.date)}</time>
      </div>
      <h3 class="post-title"><a href="detail.html?id=${p.id}&t=blog">${esc(p.title)}</a></h3>
      <p class="post-intro">${esc(p.intro)}</p>
      <div class="post-foot">
        <span class="post-stats">${BLOG_ICONS.clock} ${p.read} 分钟 · ${BLOG_ICONS.eye} ${p.views}</span>
        <a class="post-more" href="detail.html?id=${p.id}&t=blog">阅读全文 ${ICONS.arrow}</a>
      </div>
    </div>
  </article>`;
}

/* ---------- 首页博客渲染 ---------- */
function renderBlogHome() {
  const grid = document.querySelector("[data-posts]");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  let state = { cat: params.get("cat") || "all", q: (params.get("q") || "").trim() };
  const chips = document.querySelectorAll("[data-catfilter]");
  const countEl = document.querySelector("[data-post-count]");
  const emptyEl = document.querySelector("[data-blog-empty]");
  const searchInput = document.querySelector("[data-blog-search]");

  if (searchInput && state.q) searchInput.value = state.q;

  function apply() {
    let list = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (state.cat !== "all") list = list.filter(p => p.cat === state.cat);
    if (state.q) {
      const kw = state.q.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.intro.toLowerCase().includes(kw) ||
        p.tags.join(" ").toLowerCase().includes(kw)
      );
    }
    grid.innerHTML = list.map(postCard).join("");
    if (countEl) countEl.textContent = list.length;
    if (emptyEl) emptyEl.style.display = list.length ? "none" : "block";
    chips.forEach(c => c.classList.toggle("active", c.dataset.catfilter === state.cat));
    initReveal();
    initLazy();
  }

  chips.forEach(c => c.addEventListener("click", () => {
    state.cat = c.dataset.catfilter;
    try {
      if (location.protocol.startsWith("http")) {
        history.replaceState(null, "", "index.html" + (state.cat === "all" ? "" : "?cat=" + state.cat));
      }
    } catch (e) { /* file:// 下忽略 */ }
    apply();
  }));

  if (searchInput) {
    let t;
    searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = searchInput.value.trim(); apply(); }, 180);
    });
  }

  apply();
}

/* ---------- 侧边栏：最新 / 热门 / 分类统计 / 公告 ---------- */
function renderBlogSidebar() {
  const recent = document.querySelector("[data-recent]");
  if (recent) {
    recent.innerHTML = RECENT.map(p => `
      <li>
        <a href="detail.html?id=${p.id}&t=blog" class="side-post">
          <img src="${p.cover}" alt="" loading="lazy">
          <div>
            <h5>${esc(p.title)}</h5>
            <span>${fmtCN(p.date)}</span>
          </div>
        </a>
      </li>`).join("");
  }

  const popular = document.querySelector("[data-popular]");
  if (popular) {
    popular.innerHTML = POPULAR.map((p, i) => `
      <li>
        <a href="detail.html?id=${p.id}&t=blog" class="hot-post">
          <em class="hot-rank rank-${i + 1}">${i + 1}</em>
          <div>
            <h5>${esc(p.title)}</h5>
            <span>${BLOG_ICONS.eye} ${p.views} 次阅读 · ${blogCat(p.cat).name}</span>
          </div>
        </a>
      </li>`).join("");
  }

  const cats = document.querySelector("[data-blogcats]");
  if (cats) {
    cats.innerHTML = Object.entries(BLOG_CATS).map(([key, c]) => {
      const n = POSTS.filter(p => p.cat === key).length;
      return `<li><a class="side-cat" href="index.html?cat=${key}">
        <span class="tag ${c.cls}">${c.name}</span><b>${n}</b></a></li>`;
    }).join("");
  }

  const notices = document.querySelector("[data-blognotice]");
  if (notices) {
    notices.innerHTML = BLOG_NOTICES.map(t =>
      `<li class="notice-item"><span class="notice-dot"></span><span>${esc(t)}</span></li>`).join("");
  }

  const total = document.querySelectorAll("[data-post-total]");
  total.forEach(el => el.textContent = POSTS.length);
}

/* ---------- 博客详情模式（detail.html?t=blog） ---------- */
function renderBlogDetail() {
  const page = document.querySelector("[data-detail]");
  if (!page) return;
  const params = new URLSearchParams(location.search);
  if (params.get("t") !== "blog") return;   // 知识库模式走原逻辑

  const p = POSTS.find(x => x.id === params.get("id")) || POSTS[0];
  const related = POSTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 3);
  const idx = POSTS.indexOf(p);

  document.title = p.title + " | 朱悦欣的博客";

  page.innerHTML = `
  <div class="blog-cover reveal"><img src="${p.cover}" alt="${esc(p.title)} 封面"></div>

  <div class="detail-header reveal">
    <nav class="breadcrumb">
      <a href="index.html">首页</a><span>/</span>
      <a href="index.html?cat=${p.cat}">${blogCat(p.cat).name}</a><span>/</span><em>正文</em>
    </nav>
    <span class="tag ${blogCat(p.cat).cls}">${blogCat(p.cat).name}</span>
    <h1>${esc(p.title)}</h1>
    <p class="detail-intro">${esc(p.intro)}</p>
    <div class="detail-meta">
      <span>📅 ${fmtCN(p.date)}</span>
      <span>${BLOG_ICONS.clock} 约 ${p.read} 分钟</span>
      <span>${BLOG_ICONS.eye} ${p.views} 次阅读</span>
      <span>✍ 朱悦欣</span>
      <span>🏷 ${p.tags.map(t => "#" + t).join(" ")}</span>
    </div>
  </div>

  <div class="detail-layout">
    <article class="detail-article reveal">
      ${p.body.map(([h, text], i) => `
        <section class="art-sec" id="sec${i}">
          <h2><i>${String(i + 1).padStart(2, "0")}</i>${esc(h)}</h2>
          <p>${esc(text)}</p>
        </section>`).join("")}

      <div class="art-tags">
        ${p.tags.map(t => `<a class="tag ${blogCat(p.cat).cls}" href="index.html?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}
      </div>

      <div class="art-refs">
        <h3>参考与延伸</h3>
        <ul>${p.refs.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      </div>

      <div class="art-nav">
        ${idx > 0 ? `<a class="art-nav-item" href="detail.html?id=${POSTS[idx - 1].id}&t=blog"><span>← 上一篇</span><strong>${esc(POSTS[idx - 1].title)}</strong></a>` : "<span></span>"}
        ${idx < POSTS.length - 1 ? `<a class="art-nav-item next" href="detail.html?id=${POSTS[idx + 1].id}&t=blog"><span>下一篇 →</span><strong>${esc(POSTS[idx + 1].title)}</strong></a>` : "<span></span>"}
      </div>
    </article>

    <aside class="detail-side">
      <div class="side-card reveal">
        <h4>${BLOG_ICONS.fresh} 最新文章</h4>
        <ul class="side-rel">${RECENT.slice(0, 4).map(r => `
          <li><a href="detail.html?id=${r.id}&t=blog"><span class="tag ${blogCat(r.cat).cls}">${blogCat(r.cat).name}</span>${esc(r.title)}</a></li>`).join("")}
        </ul>
      </div>
      <div class="side-card reveal">
        <h4>${BLOG_ICONS.fire} 热门文章</h4>
        <ul class="hot-list">${POPULAR.slice(0, 4).map((r, i) => `
          <li><a href="detail.html?id=${r.id}&t=blog" class="hot-post">
            <em class="hot-rank rank-${i + 1}">${i + 1}</em>
            <div><h5>${esc(r.title)}</h5><span>${r.views} 次阅读</span></div>
          </a></li>`).join("")}
        </ul>
      </div>
      <div class="side-card reveal">
        <h4>相关文章</h4>
        <ul class="side-rel">${related.length ? related.map(r => `
          <li><a href="detail.html?id=${r.id}&t=blog"><span class="tag ${blogCat(r.cat).cls}">${blogCat(r.cat).name}</span>${esc(r.title)}</a></li>`).join("")
      : '<li class="side-empty">该分类暂无更多文章</li>'}
        </ul>
      </div>
    </aside>
  </div>`;

  // 阅读进度条（detail.html 已有 .read-progress）
  const bar = document.querySelector(".read-progress");
  if (bar) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = Math.min(100, (window.scrollY / Math.max(1, h)) * 100) + "%";
    };
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }
}

/* ---------- 启动 ----------
   注意：main.js 的 DOMContentLoaded 也会调用 initLazy()，
   这里只负责渲染博客内容，图片懒加载统一由 main.js 处理，避免重复绑定。 */
document.addEventListener("DOMContentLoaded", () => {
  renderBlogHome();
  renderBlogSidebar();
  renderBlogDetail();
  initReveal();
});
