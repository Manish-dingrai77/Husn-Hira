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