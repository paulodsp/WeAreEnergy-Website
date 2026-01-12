/**
 * We Are Energy - REFINED Scroll Effects
 * Fixed counter to preserve formatting
 */

(function() {
  'use strict';

  var hasGSAP = (typeof gsap !== 'undefined') && (typeof ScrollTrigger !== 'undefined');
  var hasIntersectionObserver = 'IntersectionObserver' in window;

  console.log('=== We Are Energy Scroll Effects (REFINED) ===');
  console.log('GSAP: ' + hasGSAP);
  console.log('IntersectionObserver: ' + hasIntersectionObserver);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('Initialising...');

    try {
      createScrollProgress();

      if (hasGSAP) {
        initGSAPAnimations();
      } else if (hasIntersectionObserver) {
        initFallbackAnimations();
      }

      initCounters();

      console.log('Ready');
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  /**
   * Scroll Progress Bar
   */
  function createScrollProgress() {
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
      var windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrolled = window.scrollY || window.pageYOffset;
      var progress = Math.min(scrolled / windowHeight, 1);
      progressBar.style.transform = 'scaleX(' + progress + ')';
    });

    console.log('âœ… Progress bar created');
  }

  /**
   * GSAP Animations - Refined
   */
  function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Text highlights - subtle
    gsap.utils.toArray('.text-highlight').forEach(function(element) {
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

    // Image reveals - smooth
    gsap.utils.toArray('.image-reveal').forEach(function(element) {
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

    // Cards - elegant stagger
    var cards = gsap.utils.toArray('.card-group .card');
    if (cards.length > 0) {
      gsap.to(cards, {
        scrollTrigger: {
          trigger: cards[0].parentElement,
          start: 'top 70%',
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
   * Fallback Animations
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

    var elements = document.querySelectorAll('.text-highlight, .image-reveal, .card-group .card');
    for (var i = 0; i < elements.length; i++) {
      observer.observe(elements[i]);
    }

    console.log('âœ… Fallback animations active');
  }

  /**
   * Counter Animations - FIXED to preserve formatting
   */
  function initCounters() {
    var counters = document.querySelectorAll('.stat-counter');
    if (counters.length === 0) {
      console.log('No counters found');
      return;
    }

    function animateCounter(element) {
      // Get the number from the span content
      var originalText = element.textContent || element.innerText;
      console.log('Counter original text: "' + originalText + '"');

      // Extract just numbers
      var numberText = originalText.replace(/[^0-9]/g, '');
var target = parseInt(numberText, 10);  // ADD THIS LINE
// NEW: Check if £ is present
var hasPound = originalText.indexOf('£') !== -1;

    console.log('Counter target: ' + target + ', Has £: ' + hasPound);

      if (isNaN(target) || target === 0) {
        console.warn('Invalid counter target for element:', element);
        return;
      }
        element.setAttribute('data-target', target);
        element.setAttribute('data-has-pound', hasPound ? 'true' : 'false');
      var duration = 2500; // Slower, more elegant
      var steps = 60;
      var increment = target / steps;
      var stepDuration = duration / steps;
      var current = 0;

      element.classList.add('counting');

      var timer = setInterval(function() {
        current += increment;
        if (current >= target) {
        var finalTarget = parseInt(element.getAttribute('data-target'), 10);
        var hasPoundStored = element.getAttribute('data-has-pound') === 'true';
        var formatted = finalTarget.toLocaleString('en-GB');
        element.textContent = hasPoundStored ? '£' + formatted : formatted;
        clearInterval(timer);
          element.classList.remove('counting');
          console.log('Counter finished: ' + target);
        } else {
        var formatted = Math.floor(current).toLocaleString('en-GB');
        var hasPoundStored = element.getAttribute('data-has-pound') === 'true';
        element.textContent = hasPoundStored ? '£' + formatted : formatted;
        }
      }, stepDuration);
    }

    if (hasIntersectionObserver) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            console.log('Counter entering viewport');
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

    console.log('âœ… Initialised ' + counters.length + ' counters');
  }

})();