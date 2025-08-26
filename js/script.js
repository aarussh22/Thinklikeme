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

// ===== Fetch Chess News (using chess.com/rss/news) =====
async function fetchChessNews() {
  const feedUrl = encodeURIComponent("https://www.chess.com/rss/news");
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`;
  const container = document.getElementById("news-list");
  if (!container) return;
  container.innerHTML = '<p>Loading news…</p>';

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    container.innerHTML = '';

    const items = data.items || [];
    if (items.length === 0) {
      container.innerHTML = '<p>No news found.</p>';
      return;
    }

    // Take just the first item for now
    const item = items[0];
    const link = item.link;
    const title = item.title;
    const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleString() : '';
    // Strip HTML from description and shorten
    const rawDesc = item.description || '';
    const cleanDesc = rawDesc.replace(/<[^>]+>/g, '').trim();
    const shortDesc = cleanDesc.length > 200 ? cleanDesc.slice(0, 200) + '…' : cleanDesc;

    const article = document.createElement('article');
    article.className = 'news-card';

    article.innerHTML = `
      <h3><a href="${link}" target="_blank" rel="noopener">${title}</a></h3>
      <small>${pubDate}</small>
      <p>${shortDesc}</p>
    `;
    container.appendChild(article);
  }
  catch (err) {
    console.error('Error fetching news:', err);
    container.innerHTML = '<p>Failed to load news.</p>';
  }
}

document.addEventListener('DOMContentLoaded', fetchChessNews);



// ===== Feedback slideshow =====
let reviews = JSON.parse(localStorage.getItem("reviews") || "[]");
let currentSlideIndex = 0;
let selectedStars = 0;
const form = document.getElementById("review-form");
const slideshow = document.getElementById("review-slideshow");
const starElements = document.querySelectorAll(".star-rating span");

function renderSlideshow() {
  if (!slideshow) return;
  slideshow.innerHTML = "";
  reviews.forEach((rev, i) => {
    const slide = document.createElement("div");
    slide.className = "review-slide" + (i === currentSlideIndex ? " active" : "");
    slide.innerHTML = `
      <p>"${rev.comment}"</p>
      <div class="review-author">- ${rev.name}</div>
      <div class="review-stars">${"★".repeat(rev.stars)}${"☆".repeat(5 - rev.stars)}</div>
    `;
    slideshow.appendChild(slide);
  });
}

function showNextSlide() {
  if (reviews.length === 0) return;
  currentSlideIndex = (currentSlideIndex + 1) % reviews.length;
  renderSlideshow();
}

setInterval(showNextSlide, 4000);

// Star selection
starElements.forEach(star => {
  star.addEventListener("click", () => {
    selectedStars = parseInt(star.dataset.star);
    starElements.forEach(s => s.classList.toggle("active", parseInt(s.dataset.star) <= selectedStars));
  });
});

// Handle form submit
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
    const newReview = { name, email, comment, stars: selectedStars };
    reviews.push(newReview);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    form.reset();
    selectedStars = 0;
    starElements.forEach(s => s.classList.remove("active"));
    currentSlideIndex = reviews.length - 1;
    renderSlideshow();
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

