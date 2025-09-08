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

// ===== Chess News (Chess.com + FIDE + ChessBase) =====
document.addEventListener('DOMContentLoaded', fetchChessNews);

async function fetchChessNews() {
  // ... (unchanged chess news code here)
}

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

// Initialize on load
renderSlideshow();

// ===== Nav hide/show on scroll =====
document.addEventListener("DOMContentLoaded", () => {
  // ... (unchanged nav code here)
});

// ===== Mobile-only helpers =====
(function () {
  // ... (unchanged orbit tap-to-reveal code)
})();
(function () {
  // ... (unchanged hero heading mobile fallback)
})();
