document.addEventListener("DOMContentLoaded", function () {
  // ========== NAVBAR SCROLL SHADOW ==========
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ========== MOBILE NAVIGATION TOGGLE ==========
  const navToggle = document.getElementById("nav-toggle");
  const closeMenu = document.getElementById("close-menu");
  const mobileMenu = document.getElementById("mobile-menu");

  // Toggle menu visibility
  if (navToggle && closeMenu && mobileMenu) {
    navToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    closeMenu.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      document.body.style.overflow = "";
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        !mobileMenu.contains(e.target) &&
        !navToggle.contains(e.target) &&
        mobileMenu.classList.contains("active")
      ) {
        mobileMenu.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    // Close on link click
    document.querySelectorAll(".mobile-menu a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      mobileMenu.classList.remove("active");
      document.body.style.overflow = "";

      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: "smooth"
      });
    });
  });

  // ========== GALLERY TAB FUNCTIONALITY ==========
  document.querySelectorAll('.gallery-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ========== FADE-IN / SLIDE-UP ANIMATION ON SCROLL ==========
  const fadeElements = document.querySelectorAll(
    '.review-card, .fade-in, .testimonial-card, .gallery-item, .stat-card'
  );

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        entry.target.classList.add('show');
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(el);
  });

  // ========== GALLERY SCROLL INDICATOR / EFFECT ==========
  const galleryScroll = document.querySelector(".gallery-grid");
  const galleryItems = document.querySelectorAll(".gallery-item");

  if (galleryScroll && galleryItems.length > 0) {
    galleryScroll.addEventListener("scroll", () => {
      galleryItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        item.classList.toggle("visible", rect.left >= 0 && rect.left < window.innerWidth);
      });
    });
  }
});


// Navigation scroll effect
    window.addEventListener('scroll', function() {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // Mobile navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const closeMenu = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    closeMenu.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      });
    });

    // Animation on scroll for benefit cards
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, {
      threshold: 0.1
    });

    document.querySelectorAll('.benefit-card').forEach(card => {
      observer.observe(card);
    });
    
    // Scroll indicators functionality
    function setupScrollIndicators(scrollContainerId, indicatorsContainerId) {
      const scrollContainer = document.getElementById(scrollContainerId);
      const indicators = document.getElementById(indicatorsContainerId).querySelectorAll('.scroll-indicator');
      
      scrollContainer.addEventListener('scroll', () => {
        const scrollPosition = scrollContainer.scrollLeft;
        const containerWidth = scrollContainer.offsetWidth;
        const scrollWidth = scrollContainer.scrollWidth;
        const cardWidth = scrollContainer.querySelector('.benefit-card, .ingredient-card, .testimonial-card').offsetWidth + 32;
        const currentCard = Math.round(scrollPosition / cardWidth);
        
        indicators.forEach((indicator, index) => {
          if (index === currentCard) {
            indicator.classList.add('active');
          } else {
            indicator.classList.remove('active');
          }
        });
      });
      
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          const cardWidth = scrollContainer.querySelector('.benefit-card, .ingredient-card, .testimonial-card').offsetWidth + 32;
          scrollContainer.scrollTo({
            left: index * cardWidth,
            behavior: 'smooth'
          });
        });
      });
    }
    
    // Initialize scroll indicators
    setupScrollIndicators('benefits-scroll', 'benefits-indicators');
    setupScrollIndicators('ingredients-scroll', 'ingredients-indicators');
    setupScrollIndicators('testimonials-scroll', 'testimonials-indicators');
    
    // Auto-scroll for carousels
    function autoScrollCarousel(scrollContainerId) {
      const scrollContainer = document.getElementById(scrollContainerId);
      const cardWidth = scrollContainer.querySelector('.benefit-card, .ingredient-card, .testimonial-card').offsetWidth + 32;
      const scrollWidth = scrollContainer.scrollWidth;
      let scrollPosition = 0;
      
      setInterval(() => {
        scrollPosition += cardWidth;
        if (scrollPosition > scrollWidth - scrollContainer.offsetWidth) {
          scrollPosition = 0;
        }
        scrollContainer.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }, 5000);
    }
    
    // Initialize auto-scroll
    autoScrollCarousel('benefits-scroll');
    autoScrollCarousel('ingredients-scroll');
    autoScrollCarousel('testimonials-scroll');

    