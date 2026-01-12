/**
 * We Are Energy - SAFE Scroll Effects
 * This script ONLY ADDS animations - never hides content
 * If this script fails, your page still works perfectly
 */

(function() {
  'use strict';

  // Feature detection
  var hasGSAP = (typeof gsap !== 'undefined') && (typeof ScrollTrigger !== 'undefined');
  var hasIntersectionObserver = 'IntersectionObserver' in window;

  console.log('=== We Are Energy Scroll Effects ===');
  console.log('GSAP available: ' + hasGSAP);
  console.log('IntersectionObserver available: ' + hasIntersectionObserver);

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('Initialising scroll effects...');

    // Always create progress bar (works without GSAP)
    createScrollProgress();

    // Try to initialise animations
    try {
      if (hasGSAP) {
        initGSAPAnimations();
      } else if (hasIntersectionObserver) {
        initFallbackAnimations();
      } else {
        console.log('No animation support - page works without animations');
      }

      // Counter animations work without GSAP
      initCounters();

      console.log('Scroll effects ready');
    } catch (error) {
      console.error('Animation error (page still works):', error);
    }
  }

  /**
   * Scroll Progress Bar - Always works
   */
  function createScrollProgress() {
    try {
      var progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress';
      progressBar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progressBar);

      window.addEventListener('scroll', function() {
        var windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        var scrolled = window.scrollY || window.pageYOffset;
        var progress = scrolled / windowHeight;
        progressBar.style.transform = 'scaleX(' + Math.min(progress, 1) + ')';
      });

      console.log('âœ… Progress bar created');
    } catch (error) {
      console.error('Progress bar failed:', error);
    }
  }

  /**
   * GSAP Animations - Best experience
   */
  function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Text highlights
    var highlights = gsap.utils.toArray('.text-highlight');
    highlights.forEach(function(element) {
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          onEnter: function() {
            element.classList.add('animate');
          },
          once: true
        }
      });
    });

    // Image reveals
    var images = gsap.utils.toArray('.image-reveal');
    images.forEach(function(element) {
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          start: 'top 75%',
          onEnter: function() {
            element.classList.add('animate');
          },
          once: true
        }
      });
    });

    // Card stagger
    var cards = gsap.utils.toArray('.card-group .card');
    if (cards.length > 0) {
      gsap.to(cards, {
        scrollTrigger: {
          trigger: cards[0].parentElement,
          start: 'top 75%',
          onEnter: function() {
            cards.forEach(function(card) {
              card.classList.add('animate');
            });
          },
          once: true
        }
      });
    }

    console.log('âœ… GSAP animations active');
  }

  /**
   * Fallback Animations - Still good without GSAP
   */
  function initFallbackAnimations() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    });

    // Observe animated elements
    var elements = document.querySelectorAll('.text-highlight, .image-reveal, .card-group .card');
    for (var i = 0; i < elements.length; i++) {
      observer.observe(elements[i]);
    }

    console.log('âœ… Fallback animations active');
  }

  /**
   * Counter Animations - Works everywhere
   */
  function initCounters() {
    var counters = document.querySelectorAll('.stat-counter');
    if (counters.length === 0) return;

    function animateCounter(element) {
      var text = element.textContent.replace(/[^0-9]/g, '');
      var target = parseInt(text, 10);
      if (isNaN(target)) return;

      var duration = 2000;
      var steps = 60;
      var increment = target / steps;
      var stepDuration = duration / steps;
      var current = 0;

      element.classList.add('counting');

      var timer = setInterval(function() {
        current += increment;
        if (current >= target) {
          element.textContent = target.toLocaleString('en-GB');
          clearInterval(timer);
          element.classList.remove('counting');
        } else {
          element.textContent = Math.floor(current).toLocaleString('en-GB');
        }
      }, stepDuration);
    }

    if (hasIntersectionObserver) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      for (var i = 0; i < counters.length; i++) {
        observer.observe(counters[i]);
      }
    } else {
      // Fallback: animate immediately
      for (var i = 0; i < counters.length; i++) {
        animateCounter(counters[i]);
      }
    }

    console.log('âœ… Initialised ' + counters.length + ' stat counters');
  }

})();