/* ============================================
   ARCHITECT — 3D Scroll Engine
   
   Handles all scroll-driven 3D effects:
   1. Scroll progress bar
   2. IntersectionObserver reveal animations
   3. Word-by-word headline reveals
   4. Parallax floating geometry
   5. Hero 3D tilt on scroll
   6. Horizontal scroll gallery (desktop)
   7. Gallery card 3D mouse tilt
   8. Navigation scroll state
   9. Custom cursor (desktop)
   10. Mobile hamburger menu
   11. Page loader
   ============================================ */

(function () {
    'use strict';

    /* ── Utility ─────────────────────────── */

    const isMobile = () => window.innerWidth <= 768;
    const isReducedMotion = () => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Clamp a value between min and max */
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    /** Linear interpolation */
    const lerp = (start, end, factor) => start + (end - start) * factor;


    /* ── 1. Scroll Progress Bar ──────────── */

    const scrollProgress = document.getElementById('scroll-progress');

    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (scrollProgress) {
            scrollProgress.style.width = progress + '%';
        }
    }


    /* ── 2. Scroll Reveal (IntersectionObserver) ── */

    function initScrollReveal() {
        if (isReducedMotion()) return;

        const revealElements = document.querySelectorAll('[data-reveal]');
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        // Don't unobserve — allow re-triggering if you want,
                        // but for performance, unobserve after reveal:
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -60px 0px',
            }
        );

        revealElements.forEach((el) => observer.observe(el));
    }


    /* ── 3. Word-by-Word Headline Reveals ── */

    function initWordReveal() {
        if (isReducedMotion()) return;

        const wordRevealElements = document.querySelectorAll('[data-word-reveal]');
        
        wordRevealElements.forEach((el) => {
            const text = el.innerHTML;
            // Split by spaces but preserve HTML tags like <em>, <br>
            const words = text.split(/(\s+)/);
            
            el.innerHTML = '';
            el.classList.add('word-reveal');

            let wordIndex = 0;
            words.forEach((word) => {
                if (word.trim() === '') {
                    // Preserve whitespace
                    el.appendChild(document.createTextNode(word));
                } else {
                    const wrapper = document.createElement('span');
                    wrapper.style.display = 'inline-block';
                    wrapper.style.overflow = 'hidden';
                    wrapper.style.verticalAlign = 'bottom';

                    const inner = document.createElement('span');
                    inner.classList.add('word-reveal__word');
                    inner.style.transitionDelay = (wordIndex * 0.06) + 's';
                    inner.innerHTML = word;
                    
                    wrapper.appendChild(inner);
                    el.appendChild(wrapper);
                    wordIndex++;
                }
            });
        });

        // Observe word-reveal containers
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('.word-reveal').forEach((el) => observer.observe(el));
    }


    /* ── 4. Parallax Floating Geometry ──── */

    const floatingElements = [];
    
    function initFloatingParallax() {
        if (isReducedMotion() || isMobile()) return;

        document.querySelectorAll('[data-parallax-speed]').forEach((el) => {
            floatingElements.push({
                el,
                speed: parseFloat(el.dataset.parallaxSpeed) || 0.3,
                baseTop: el.getBoundingClientRect().top + window.scrollY,
            });
        });
    }

    function updateFloatingParallax() {
        if (isReducedMotion() || isMobile()) return;

        const scrollY = window.scrollY;
        floatingElements.forEach((item) => {
            const offset = (scrollY - item.baseTop) * item.speed;
            item.el.style.transform = `translateY(${offset}px)`;
        });
    }


    /* ── 5. Hero 3D Tilt on Scroll ──────── */

    const heroImageWrapper = document.querySelector('.hero__image-wrapper');
    
    function updateHeroTilt() {
        if (!heroImageWrapper || isReducedMotion() || isMobile()) return;

        const hero = document.getElementById('hero');
        if (!hero) return;

        const rect = hero.getBoundingClientRect();
        const viewportH = window.innerHeight;
        
        // Progress: 0 at top of viewport, 1 when hero is fully scrolled past
        const progress = clamp(-rect.top / (rect.height), 0, 1);
        
        const rotateY = 3 - progress * 6;
        const rotateX = progress * 12;
        const translateZ = -progress * 80;
        const scale = 1 - progress * 0.05;

        heroImageWrapper.style.transform = 
            `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`;
    }


    /* ── 6. Horizontal Scroll Gallery ───── */

    const gallerySection = document.getElementById('gallery');
    const galleryTrack = document.querySelector('.gallery__track');
    
    function updateHorizontalScroll() {
        if (!gallerySection || !galleryTrack || isMobile()) return;

        const rect = gallerySection.getBoundingClientRect();
        const sectionHeight = gallerySection.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Calculate how far we've scrolled through the gallery section
        const scrollProgress = clamp(
            -rect.top / (sectionHeight - viewportHeight),
            0,
            1
        );

        // Calculate the max scroll distance for the track
        const trackWidth = galleryTrack.scrollWidth;
        const containerWidth = gallerySection.offsetWidth - 96; // subtract padding
        const maxScroll = Math.max(0, trackWidth - containerWidth);

        galleryTrack.style.transform = `translateX(${-scrollProgress * maxScroll}px)`;
    }


    /* ── 7. Gallery Card 3D Mouse Tilt ──── */

    function initCardTilt() {
        if (isMobile() || isReducedMotion()) return;

        const cards = document.querySelectorAll('.gallery__card');
        
        cards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                card.style.transform = 
                    `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) translateZ(16px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
            });
        });
    }


    /* ── 8. Navigation Scroll State ──────── */

    const nav = document.getElementById('main-nav');
    let lastScrollY = 0;

    function updateNavState() {
        if (!nav) return;

        const scrollY = window.scrollY;
        
        if (scrollY > 80) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScrollY = scrollY;
    }


    /* ── 9. Custom Cursor (Desktop) ──────── */

    const cursorOuter = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursor-dot');
    let mouseX = 0, mouseY = 0;
    let cursorOuterX = 0, cursorOuterY = 0;

    function initCustomCursor() {
        if (isMobile() || !cursorOuter || !cursorDot) return;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Dot follows instantly
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        // Add hover class on interactive elements
        const hoverTargets = document.querySelectorAll('a, button, .gallery__card');
        hoverTargets.forEach((el) => {
            el.addEventListener('mouseenter', () => cursorOuter.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursorOuter.classList.remove('hovering'));
        });
    }

    function updateCustomCursor() {
        if (isMobile() || !cursorOuter) return;

        // Smooth eased follow for outer ring
        cursorOuterX = lerp(cursorOuterX, mouseX, 0.12);
        cursorOuterY = lerp(cursorOuterY, mouseY, 0.12);
        
        cursorOuter.style.left = cursorOuterX + 'px';
        cursorOuter.style.top = cursorOuterY + 'px';
    }


    /* ── 10. Mobile Hamburger Menu ──────── */

    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobile-menu');

        if (!hamburger || !mobileMenu) return;

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            document.body.style.overflow = 
                mobileMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }


    /* ── 11. Page Loader ─────────────────── */

    function initLoader() {
        const loader = document.getElementById('page-loader');
        if (!loader) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('loaded');
            }, 600);
        });
    }


    /* ── Main Animation Loop ─────────────── */

    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateScrollProgress();
                updateNavState();
                updateHeroTilt();
                updateHorizontalScroll();
                updateFloatingParallax();
                ticking = false;
            });
            ticking = true;
        }
    }

    function animateCursor() {
        updateCustomCursor();
        requestAnimationFrame(animateCursor);
    }


    /* ── Initialization ──────────────────── */

    function init() {
        // Setup
        initLoader();
        initScrollReveal();
        initWordReveal();
        initFloatingParallax();
        initCardTilt();
        initCustomCursor();
        initMobileMenu();

        // Scroll listener
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Initial call to set state
        updateScrollProgress();
        updateNavState();
        updateHeroTilt();
        updateHorizontalScroll();

        // Start cursor animation loop (desktop only)
        if (!isMobile()) {
            animateCursor();
        }

        // Handle resize — recalculate on orientation change
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Recalculate floating element positions
                floatingElements.forEach((item) => {
                    item.baseTop = item.el.getBoundingClientRect().top + window.scrollY;
                });
            }, 250);
        });
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
