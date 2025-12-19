# We Are Energy - Modernised Website (Guardian-Style Scroll Effects)

## 🎯 Overview

This fork modernises the We Are Energy Co-operative website with Guardian newspaper-style scroll animations and interactive effects whilst maintaining the existing Bootstrap 5.3.8 framework and brand identity.

## 📦 New Files Included

### 1. `index-modern.html`
- Modernised version of your homepage
- Includes all GSAP script links
- Text highlights, stat counters, and image reveal classes added
- Ready to test

### 2. `css/scroll-animations.css`
- Custom CSS for scroll-triggered effects
- Guardian-style parallax and fade animations
- Responsive and accessibility-friendly
- Respects `prefers-reduced-motion` settings

### 3. `js/scroll-effects.js`
- GSAP-powered scroll animations
- Includes fallback for browsers without GSAP
- Number counter animations for statistics
- Carousel enhancements
- Smooth scrolling to anchor links

## 🚀 Installation Instructions

### Step 1: Set Up Fork in GitHub

1. Create a new branch called `modernisation-test`:
   ```bash
   git checkout -b modernisation-test
   ```

2. Copy the three new files to your repository:
   - Copy `index-modern.html` to root directory
   - Copy `scroll-animations.css` to `/css/` folder
   - Copy `scroll-effects.js` to `/js/` folder

### Step 2: File Structure

Your updated file structure should look like:

```
WeAreEnergy.coop/
├── index.html                  (original)
├── index-modern.html           (NEW - modernised version)
├── about.html
├── faqs.html
├── thankyou.html
├── css/
│   ├── carousel.css
│   ├── jumbotron-we-custom.css
│   ├── navbar-top-fixed.css
│   └── scroll-animations.css   (NEW)
├── js/
│   ├── webapi.js
│   └── scroll-effects.js       (NEW)
├── images/
│   ├── farewellfossilfuelsnl.jpg
│   ├── resilience-nologo.png
│   └── ...
└── fonts/
    └── oswald-stencil.otf
```

### Step 3: Test Locally

1. Rename `index-modern.html` to `index.html` (or test it separately first)
2. Open in a browser locally or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Or PHP
   php -S localhost:8000
   ```
3. Visit `http://localhost:8000` in your browser

### Step 4: Deploy to GitHub Pages

1. Commit the new files:
   ```bash
   git add css/scroll-animations.css
   git add js/scroll-effects.js
   git add index-modern.html
   git commit -m "Add Guardian-style scroll animations"
   git push origin modernisation-test
   ```

2. Test on your GitHub Pages preview before merging to main

## ✨ Features Added

### 1. Scroll Progress Bar
- Lime green progress bar at top of page
- Shows reading progress as user scrolls
- Positioned below fixed navbar

### 2. Fade-in Sections
- All major sections fade in as user scrolls
- Smooth 60fps animations using GSAP
- Sections animate from bottom to top

### 3. Staggered Card Animations
- Your three benefit cards (Red, Black, Green) animate in sequence
- Slight bounce effect for visual interest
- 0.2 second delay between each card

### 4. Animated Number Counters
- Statistics count up from 0:
  - "16 tonnes of CO₂"
  - "£6,000 savings"
  - "£4,400" and "£21,000" lease savings
- Formatted with British number conventions (commas)

### 5. Parallax Image Effects
- Carousel images move at different speed to text
- "Farewell Fossil Fuels" and "Resilience" images have subtle parallax
- Creates depth and engagement

### 6. Text Highlights
- Key phrases get lime green highlight as they scroll into view:
  - "No upfront cost"
  - "Act now"
  - "JOIN THE GREEN ENERGY"
- Background colour (#c0d726) matches brand

### 7. Image Reveals
- Main images slide in with overlay effect
- Professional magazine-style presentation

### 8. Enhanced Carousel
- Fade overlay on carousel slides
- Caption elements animate sequentially
- Smooth transitions between slides

## 🎨 Design Principles

### Maintains Your Brand Identity
- Lime green (#c0d726)
- Dark charcoal (#373838)
- Cream (#f1eee6)
- Coral (#F26B5B)
- Custom 'Stencil' and 'Oswald' fonts preserved

### Performance Optimised
- 60fps animations using GSAP
- Hardware-accelerated transforms
- Lazy loading compatible
- Minimal JavaScript overhead (~10KB)

### Accessibility First
- Respects `prefers-reduced-motion` settings
- Keyboard navigation maintained
- Screen reader friendly (animations hidden from assistive tech)
- Semantic HTML preserved

### Mobile Responsive
- Reduced animation intensity on mobile
- Touch-friendly interactions
- Maintains Bootstrap 5 responsive grid

## 🔧 Customisation Options

### Adjust Animation Speed

In `js/scroll-effects.js`, change duration values:

```javascript
// Make animations faster
duration: 0.5  // was 1.0

// Make animations slower  
duration: 1.5  // was 1.0
```

### Change Scroll Trigger Points

In `js/scroll-effects.js`, adjust `start` values:

```javascript
scrollTrigger: {
  start: 'top 90%',  // Trigger earlier (was 85%)
  start: 'top 70%',  // Trigger later (was 85%)
}
```

### Disable Specific Effects

Comment out lines in `initScrollEffects()`:

```javascript
function initScrollEffects() {
  createScrollProgress();
  animateSections();
  // animateCards();        // Disable card animations
  animateCounters();
  // animateParallax();     // Disable parallax
  animateHighlights();
  animateImageReveals();
  enhanceCarousel();
}
```

### Modify Colours

In `css/scroll-animations.css`:

```css
/* Change progress bar colour */
.scroll-progress {
  background: linear-gradient(90deg, #YOUR-COLOR 0%, #YOUR-COLOR-2 100%);
}

/* Change text highlight colour */
.text-highlight {
  background: linear-gradient(180deg, transparent 65%, #YOUR-COLOR 65%);
}
```

## 🐛 Troubleshooting

### Animations Not Working

1. Check browser console for errors (F12)
2. Verify GSAP is loading:
   ```javascript
   console.log(typeof gsap); // Should output "object"
   ```
3. Check file paths are correct (case-sensitive on Linux servers)
4. Clear browser cache (Ctrl+Shift+R)

### Performance Issues

1. Reduce number of animated elements
2. Increase `scrub` values for parallax (makes them less smooth but more performant)
3. Disable parallax on mobile devices

### Images Not Revealing

1. Ensure images are wrapped in `<picture class="image-reveal">` tags
2. Check image paths are correct
3. Verify images are loading (check Network tab in DevTools)

## 📊 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari | iOS 14+ | ✅ Full support |
| Chrome Mobile | Latest | ✅ Full support |
| IE 11 | n/a | ⚠️ Fallback only |

## 📈 Performance Metrics

Expected performance improvements:

- **Lighthouse Performance**: 90+/100
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🔗 Resources

- [GSAP Documentation](https://greensock.com/docs/)
- [ScrollTrigger Guide](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [Bootstrap 5.3 Docs](https://getbootstrap.com/docs/5.3/)
- [Guardian Interactive Examples](https://www.theguardian.com/interactive)

## 🤝 Support

If you encounter issues:

1. Check browser console for error messages
2. Test with GSAP fallback disabled (comment out GSAP scripts)
3. Verify all files are in correct directories
4. Clear Cloudflare cache if using CDN

## 📝 Version History

- **v1.0.0** (December 2025) - Initial modernisation release
  - Guardian-style scroll effects
  - GSAP ScrollTrigger integration
  - Number counter animations
  - Parallax images
  - Text highlights

## 🎯 Next Steps

Once tested and approved:

1. Merge to main branch
2. Update other pages (about.html, faqs.html) with similar effects
3. Consider adding:
   - Scroll-triggered video playback
   - Interactive data visualisations
   - More complex parallax scenes
   - Page transition effects

## 📧 Contact

We Are Energy Co-operative  
Email: all@weareenergy.coop  
Website: https://WeAreEnergy.coop

---

**Built with caring, creative and collaborative values** 💚
