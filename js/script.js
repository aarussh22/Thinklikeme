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

// ===== Fetch Chess News =====
async function fetchChessNews() {
  const feedUrl = encodeURIComponent("https://www.chess.com/news/rss");
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`;
  const container = document.getElementById("news-list");
  if (!container) return;
  container.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch(url);
    const data = await res.json();
    container.innerHTML = '';

    (data.items || []).slice(0, 5).forEach(item => {
      const a = document.createElement('a');
      a.href = item.link;
      a.target = '_blank';
      a.className = 'news-card';
      a.innerHTML = `<h3>${item.title}</h3><p>${item.description}</p>`;
      container.appendChild(a);
    });

    if (!container.children.length) {
      container.innerHTML = '<p>No news found.</p>';
    }
  } catch (err) {
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
