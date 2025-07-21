
  // Toggle Mobile Menu
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenu = document.getElementById('close-menu');

  navToggle?.addEventListener('click', () => {
    mobileMenu.classList.add('show');
  });

  closeMenu?.addEventListener('click', () => {
    mobileMenu.classList.remove('show');
  });

  // Card Hover Animation (Optional)
  document.querySelectorAll('.terms-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });

  // Scroll Animation
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.terms-card');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => {
      card.style.opacity = 0;
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  });

