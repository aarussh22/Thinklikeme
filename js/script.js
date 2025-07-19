

// Feedback slideshow
const slides = document.querySelectorAll("#feedback-section .slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let currentSlide = 0;
let slideInterval;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
  currentSlide = index;
}

function startSlideShow() {
  slideInterval = setInterval(() => {
    let nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }, 6000);
}

prevBtn.addEventListener("click", () => {
  clearInterval(slideInterval);
  let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(prevIndex);
  startSlideShow();
});

nextBtn.addEventListener("click", () => {
  clearInterval(slideInterval);
  let nextIndex = (currentSlide + 1) % slides.length;
  showSlide(nextIndex);
  startSlideShow();
});

showSlide(0);
startSlideShow();
