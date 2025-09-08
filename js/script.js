// ===== Hero heading after video ends (with fallback) =====
const video = document.getElementById('bgVideo');
const heading = document.getElementById('heading');

function showHeroHeading() {
  if (!heading.classList.contains('show')) {
    heading.classList.add('show');
  }
}

if (video && heading) {
  video.addEventListener('ended', showHeroHeading);
  // Fallback: show after 2.5s in case video loops or fails to end
  setTimeout(showHeroHeading, 2500);
}

// ===== Chess News (Chess.com + FIDE + ChessBase) — title + image + first 5 lines
// ===== Filters: last 2 days only; rotate sets every 1 hour; background pop + random glow
async function fetchChessNews() {
  const container = document.getElementById("news-list");
  const section = document.getElementById("live-chess-news");
  if (!container || !section) return;

  // Candidate feeds (ChessBase paths can vary)
  const FEEDS = [
    { name: "Chess.com", urls: ["https://www.chess.com/rss/news"] },
    { name: "FIDE", urls: ["https://www.fide.com/feed", "https://fide.com/feed"] },
    { name: "ChessBase", urls: ["https://en.chessbase.com/rss", "https://en.chessbase.com/rss/news", "https://en.chessbase.com/rss/feed"] },
  ];

  const toRss2Json = (url) =>
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;

  const escapeHTML = (s = "") =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Keep paragraph breaks, strip tags
  const htmlToPlainText = (html = "") =>
    html
      .replace(/<(p|div|li|br|h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/(\n\s*)+/g, "\n")
      .trim();

  // First 5 non-empty lines
  const firstFiveLines = (text = "") => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.slice(0, 5).join("\n");
  };

  // Try to pick an image from common RSS fields or inline HTML
  const pickImage = (item) => {
    if (item.thumbnail) return item.thumbnail;
    if (item.enclosure && item.enclosure.link) return item.enclosure.link;
    if (Array.isArray(item.enclosures) && item.enclosures[0]?.link) return item.enclosures[0].link;
    const html = item.content || item.description || "";
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m ? m[1] : "";
  };

  async function loadFeed(feed) {
    for (const u of feed.urls) {
      try {
        const res = await fetch(toRss2Json(u));
        if (!res.ok) continue;
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) continue;

        return items.map(it => {
          const rawHTML = it.content || it.description || "";
          return {
            title: it.title || "Untitled",
            link: it.link || "#",
            pubDate: it.pubDate ? new Date(it.pubDate) : new Date(0),
            source: feed.name,
            image: pickImage(it),
            preview: firstFiveLines(htmlToPlainText(rawHTML)),
          };
        });
      } catch { /* try next candidate URL */ }
    }
    return [];
  }

  // Show loading with timestamp (local to the browser)
  const now = new Date();
  container.innerHTML = `<p>Loading latest news… <small>${now.toLocaleString()}</small></p>`;

  let articles = [];
  try {
    const results = await Promise.allSettled(FEEDS.map(loadFeed));
    results.forEach(r => { if (r.status === "fulfilled") articles = articles.concat(r.value); });
  } catch (e) {
    console.error("News fetch error:", e);
  }

  // Filter: only last 2 days (48h)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  articles = articles.filter(a => a.pubDate && a.pubDate >= cutoff);

  if (!articles.length) {
    container.innerHTML = `<p>No recent news (last 48 hours). <small>Checked ${new Date().toLocaleString()}</small></p>`;
    return;
  }

  // Prefer latest news
  articles.sort((a, b) => b.pubDate - a.pubDate);

  // Pool and build rotating sets: 5 items (your CSS places 3 top, 2 offset below)
  const pool = articles.slice(0, 25);
  const chunkSize = 5;
  const sets = [];
  for (let i = 0; i < pool.length; i += chunkSize) {
    const slice = pool.slice(i, i + chunkSize);
    const setEl = document.createElement('div');
    setEl.className = 'news-set';

    const gridHTML = slice.map(item => {
      const imageHTML = item.image
        ? `<img src="${item.image}" alt="" style="width:100%;height:auto;border-radius:8px;margin-bottom:10px;object-fit:cover;">`
        : "";
      return `
        <a class="news-card" href="${item.link}" target="_blank" rel="noopener"
           style="aspect-ratio:auto; min-height: 220px;">
          <h3>${escapeHTML(item.title)}</h3>
          ${imageHTML}
          <div class="news-desc"
               style="white-space:pre-line; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; font-size:.95rem; color:#e8e8e8;">
            ${escapeHTML(item.preview)}
          </div>
        </a>
      `;
    }).join('');

    setEl.innerHTML = `<div class="news-grid">${gridHTML}</div>`;
    sets.push(setEl);
  }

  // Theme pop + random glow
  let idx = 0, theme = 0, rotateTimer = null, glowTimer = null;

  function startGlowCycle() {
    if (glowTimer) clearInterval(glowTimer);
    const cards = Array.from(container.querySelectorAll('.news-card'));
    if (!cards.length) return;

    let order = cards.map((_, i) => i).sort(() => Math.random() - 0.5);
    let k = 0;

    function glowNext() {
      cards.forEach(c => c.classList.remove('glow'));
      const nextIdx = order[k % order.length];
      cards[nextIdx].classList.add('glow');
      k++;
      if (k % order.length === 0) order = order.sort(() => Math.random() - 0.5);
    }

    glowNext();
    glowTimer = setInterval(glowNext, 1500); // hop every 1.5s
  }

  function showSet(i, withPop = false) {
    container.innerHTML = '';
    const el = sets[i];
    container.appendChild(el);
    void el.offsetWidth;              // enable transition
    el.classList.add('active');

    section.classList.remove('news-theme-0', 'news-theme-1', 'news-theme-2');
    section.classList.add(`news-theme-${theme % 3}`);
    if (withPop) {
      section.classList.remove('news-pop');
      void section.offsetWidth;       // restart bg pop
      section.classList.add('news-pop');
    }

    startGlowCycle();
  }

  // First view
  showSet(idx, true);

  // Rotate sets every 1 hour
  if (rotateTimer) clearInterval(rotateTimer);
  if (sets.length > 1) {
    rotateTimer = setInterval(() => {
      idx = (idx + 1) % sets.length;
      theme = (theme + 1) % 3;
      showSet(idx, true);
    }, 3600000); // 1 hour
  }
}

document.addEventListener('DOMContentLoaded', fetchChessNews);

// ===== Feedback Slideshow (Dynamic, 5-star only, swivel animation) =====

// Load reviews (persist in localStorage)
let reviews = JSON.parse(localStorage.getItem("reviews") || "[]")
  .filter(r => r.stars === 5); // only keep 5-star
let currentSlideIndex = 0;
let selectedStars = 0;

// DOM elements
const form = document.getElementById("review-form");
const slideshow = document.getElementById("review-slideshow");
const starElements = document.querySelectorAll(".star-rating span");

// --- Render slideshow with swivel animation ---
function renderSlideshow() {
  if (!slideshow) return;
  slideshow.innerHTML = "";

  if (reviews.length === 0) {
    slideshow.innerHTML = "<p>No reviews yet. Be the first!</p>";
    return;
  }

  reviews.forEach((rev, i) => {
    const slide = document.createElement("div");
    slide.className = "review-slide" + (i === currentSlideIndex ? " active" : "");
    slide.innerHTML = `
      <div class="review-card">
        <h3>${rev.name}</h3>
        <p>"${rev.comment}"</p>
        <div class="stars">★★★★★</div>
        <small>${new Date(rev.date || Date.now()).toLocaleDateString()}</small>
      </div>
    `;
    slideshow.appendChild(slide);
  });
}

// --- Auto-rotate slides ---
function showNextSlide() {
  if (reviews.length === 0) return;
  const slides = document.querySelectorAll(".review-slide");
  slides[currentSlideIndex]?.classList.remove("active");
  currentSlideIndex = (currentSlideIndex + 1) % reviews.length;
  slides[currentSlideIndex]?.classList.add("active");
}
setInterval(showNextSlide, 4000);

// --- Star selection (highlight) ---
starElements.forEach(star => {
  star.addEventListener("click", () => {
    selectedStars = parseInt(star.dataset.star);
    starElements.forEach(s =>
      s.classList.toggle("active", parseInt(s.dataset.star) <= selectedStars)
    );
  });
});

// --- Handle form submission ---
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("review-name").value.trim();
    const email = document.getElementById("review-email").value.trim();
    const comment = document.getElementById("review-comment").value.trim();

    if (!name || !email || !comment || selectedStars === 0) {
      alert("Please fill all fields and select a star rating.");
      return;
    }

    const newReview = {
      name,
      email,
      comment,
      stars: selectedStars,
      date: new Date()
    };

    // Only store if 5-star
    if (newReview.stars === 5) {
      reviews.unshift(newReview);        // add at start
      reviews = reviews.slice(0, 10);    // keep only 10 latest
      localStorage.setItem("reviews", JSON.stringify(reviews));
      currentSlideIndex = 0;
      renderSlideshow();
    }

    form.reset();
    selectedStars = 0;
    starElements.forEach(s => s.classList.remove("active"));
  });
}

renderSlideshow();

// ===== Nav hide/show on scroll =====
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("top-nav");
  const iconsSection = document.getElementById("staircase-icons");
  if (!nav || !iconsSection) return;

  let lastY = window.pageYOffset;

  const onScroll = () => {
    const y = window.pageYOffset;
    const dirDown = y > lastY;
    lastY = y;

    if (y < 40) {
      nav.classList.remove("hide-nav");
      return;
    }

    const rect = iconsSection.getBoundingClientRect();
    const reachedIcons = rect.top <= nav.offsetHeight;

    if (dirDown && reachedIcons) {
      nav.classList.add("hide-nav");
    } else if (!dirDown) {
      nav.classList.remove("hide-nav");
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});

// --------- Mobile-only helpers (no desktop changes) ---------

// 1) Tap-to-reveal for orbit text on touch devices (mimics :hover)
(function () {
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouch) return;

  const icons = Array.from(document.querySelectorAll('.stair-icon'));
  if (!icons.length) return;

  icons.forEach(icon => {
    icon.addEventListener('click', (e) => {
      // toggle this one, turn others off (one open at a time feels clean on mobile)
      const wasOpen = icon.classList.contains('tapped');
      icons.forEach(i => i.classList.remove('tapped'));
      if (!wasOpen) icon.classList.add('tapped');
      // prevent accidental navigation if user is just toggling (2nd tap will follow link)
      e.preventDefault();
    }, { passive: false });
  });
})();

// 2) Hero heading robustness on mobile: if video fails to autoplay, show heading quickly
(function () {
  const video = document.getElementById('bgVideo');
  const heading = document.getElementById('heading');
  if (!video || !heading) return;

  // If autoplay is blocked on some devices, make sure heading appears sooner
  const quickFallback = setTimeout(() => {
    if (!heading.classList.contains('show')) heading.classList.add('show');
  }, 1400);

  // If the video actually starts playing, keep your original timing
  video.addEventListener('playing', () => clearTimeout(quickFallback));
})();

