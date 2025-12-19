/**
 * We Are Energy - Modern Scroll Animations
 * Optimised for Bootstrap 5.3.8
 * Guardian-style interactive effects
 */

(function() {
  'use strict';

  // Wait for DOM and GSAP to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollEffects);
  } else {
    initScrollEffects();
  }

  function initScrollEffects() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded - using fallback animations');
      initFallbackAnimations();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // 1. Scroll Progress Indicator
    createScrollProgress();

    // 2. Fade-in Sections
    animateSections();

    // 3. Staggered Cards (your three benefit cards)
    animateCards();

    // 4. Number Counters (CO2 savings, cost savings)
    animateCounters();

    // 5. Parallax Images
    animateParallax();

    // 6. Text Highlights
    animateHighlights();

    // 7. Image Reveals
    animateImageReveals();

    // 8. Carousel Enhancements
    enhanceCarousel();
  }

  // Scroll Progress Bar
  function createScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);

    gsap.to(progressBar, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3
      }
    });
  }

  // Animate sections as they enter viewport
  function animateSections() {
    const sections = gsap.utils.toArray('section, .featurette, .jumbotron-fluid');
    
    sections.forEach((section, i) => {
      gsap.from(section, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          end: 'top 60%',
          toggleActions: 'play none none none',
          once: true
        }
      });
    });
  }

  // Staggered card animations (your three benefit cards)
  function animateCards() {
    const cards = document.querySelectorAll('.marketing .card-group');
    
    if (cards.length > 0) {
      gsap.from(cards, {
        opacity: 0,
        y: 80,
        scale: 0.9,
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: '.marketing',
          start: 'top 75%',
          toggleActions: 'play none none none',
          once: true
        }
      });
    }
  }

  // Animated number counters
  function animateCounters() {
    // Find elements with numbers in your content
    const counterSelectors = [
      '.card-text strong', // "Save 16 tonnes"
      '.display-4',
      '.stat-counter'
    ];

    counterSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(el => {
        const text = el.textContent;
        const match = text.match(/([\d,]+)/);
        
        if (match) {
          const number = match[1];
          const targetValue = parseInt(number.replace(/,/g, ''));
          const prefix = text.split(number)[0];
          const suffix = text.split(number)[1] || '';
          
          // Animate from 0 to target
          gsap.from(el, {
            textContent: 0,
            duration: 2.5,
            ease: 'power2.out',
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true
            },
            onUpdate: function() {
              const current = Math.ceil(this.targets()[0].textContent);
              el.textContent = prefix + current.toLocaleString('en-GB') + suffix;
            }
          });
        }
      });
    });
  }

  // Parallax effect on images
  function animateParallax() {
    const parallaxImages = document.querySelectorAll('.carousel-item img, .carousel-item svg');
    
    parallaxImages.forEach(img => {
      gsap.to(img, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: '.carousel',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    });

    // Parallax on your "Farewell Fossil Fuels" and "Resilience" images
    const contentImages = document.querySelectorAll('picture img');
    contentImages.forEach(img => {
      gsap.to(img, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('picture'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      });
    });
  }

  // Highlight text as it scrolls into view
  function animateHighlights() {
    const highlights = document.querySelectorAll('.text-highlight');
    
    highlights.forEach(highlight => {
      ScrollTrigger.create({
        trigger: highlight,
        start: 'top 85%',
        onEnter: () => highlight.classList.add('is-visible'),
        once: true
      });
    });
  }

  // Image reveal effect
  function animateImageReveals() {
    const images = document.querySelectorAll('.image-reveal');
    
    images.forEach(img => {
      ScrollTrigger.create({
        trigger: img,
        start: 'top 80%',
        onEnter: () => img.classList.add('is-visible'),
        once: true
      });
    });
  }

  // Enhance Bootstrap carousel with custom effects
  function enhanceCarousel() {
    const carousel = document.querySelector('#myCarousel');
    if (!carousel) return;

    // Add fade overlay divs to carousel items
    const carouselItems = carousel.querySelectorAll('.carousel-item');
    carouselItems.forEach(item => {
      if (!item.querySelector('.carousel-fade-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'carousel-fade-overlay';
        item.appendChild(overlay);
      }
    });

    // Listen to Bootstrap 5 carousel events
    carousel.addEventListener('slide.bs.carousel', function(event) {
      const activeItem = event.relatedTarget;
      
      // Animate caption on slide change
      const caption = activeItem.querySelector('.carousel-caption');
      if (caption) {
        gsap.from(caption.children, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out',
          delay: 0.3
        });
      }
    });
  }

  // Fallback animations if GSAP not available
  function initFallbackAnimations() {
    // Create scroll progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = (scrollTop / scrollHeight) * 100;
      progressBar.style.width = scrollPercent + '%';
    });

    // Intersection Observer for fade-ins
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('section, .card-group').forEach(el => {
      el.classList.add('animate-on-scroll');
      observer.observe(el);
    });
  }

})();
