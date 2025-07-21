// ========== NAVBAR SCROLL SHADOW ==========
window.addEventListener('scroll', function () {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ========== MOBILE NAVIGATION TOGGLE ==========
const toggleBtn = document.getElementById("nav-toggle");
const closeBtn = document.getElementById("close-menu"); // ID for your <button>
const mobileNav = document.getElementById("mobile-menu"); // slide menu

// Open menu
toggleBtn.addEventListener("click", () => {
  mobileNav.classList.add("active");
  document.body.style.overflow = 'hidden';
});

// Close menu via close button
closeBtn.addEventListener("click", () => {
  mobileNav.classList.remove("active");
  document.body.style.overflow = '';
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!mobileNav.contains(e.target) && !toggleBtn.contains(e.target)) {
    mobileNav.classList.remove("active");
    document.body.style.overflow = '';
  }
});

// Close menu on nav link click
document.querySelectorAll(".mobile-menu a").forEach(link => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("active");
    document.body.style.overflow = '';
  });
});

// ========== SMOOTH SCROLLING ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    e.preventDefault();

    // Close nav if open
    mobileNav.classList.remove("active");
    document.body.style.overflow = '';

    window.scrollTo({
      top: targetElement.offsetTop - 80,
      behavior: 'smooth'
    });
  });
});

// ========== ANIMATION ON SCROLL ==========
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.detail-card, .ingredient-card, .step').forEach(el => {
  observer.observe(el);
});

// ========== SCROLL INDICATORS & AUTOSCROLL ==========
setupScrollIndicators('choose-scroll', 'choose-indicators');
autoScrollCarousel('choose-scroll');
