
(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = themeToggle?.querySelector('.theme-label');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('vm-theme', next); } catch (_) {}
    const light = next === 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(light));
      themeToggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    }
    if (themeLabel) themeLabel.textContent = light ? 'Dark' : 'Stone';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#F2EDE5' : '#0A0A09';
  }

  applyTheme(root.dataset.theme);
  themeToggle?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  function closeMenu(returnFocus = false) {
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    mobileMenu?.classList.remove('is-open');
    body.classList.remove('menu-open');
    if (returnFocus) menuToggle?.focus();
  }

  function openMenu() {
    menuToggle?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    mobileMenu?.classList.add('is-open');
    body.classList.add('menu-open');
    mobileMenu?.querySelector('a')?.focus();
  }

  menuToggle?.addEventListener('click', () => {
    menuToggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });

  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));

  const onScroll = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 36);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // Counters
  const counters = document.querySelectorAll('[data-count]');
  const setCounterFinal = el => {
    el.textContent = `${el.dataset.count || ''}${el.dataset.suffix || ''}`;
  };
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    counters.forEach(setCounterFinal);
  } else {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const duration = target > 100 ? 850 : 1050;

        function tick(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: .55 });
    counters.forEach(el => counterObserver.observe(el));
  }



  // Gallery lightbox
  const workItems = [...document.querySelectorAll('.work-item')];
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxMeta = document.getElementById('lightbox-meta');
  const closeButton = document.getElementById('lightbox-close');
  const prevButton = document.getElementById('lightbox-prev');
  const nextButton = document.getElementById('lightbox-next');
  let currentIndex = 0;
  let lastTrigger = null;

  function renderLightbox(index) {
    if (!workItems.length) return;
    currentIndex = (index + workItems.length) % workItems.length;
    const item = workItems[currentIndex];
    const thumb = item.querySelector('img');
    if (lightboxImage) {
      lightboxImage.src = item.dataset.src || thumb?.src || '';
      lightboxImage.alt = thumb?.alt || '';
    }
    if (lightboxTitle) lightboxTitle.textContent = item.dataset.title || '';
    if (lightboxMeta) lightboxMeta.textContent = item.dataset.meta || '';
  }

  function openLightbox(index, trigger) {
    renderLightbox(index);
    lastTrigger = trigger || null;
    lightbox?.classList.add('is-open');
    lightbox?.setAttribute('aria-hidden', 'false');
    body.classList.add('lightbox-open');
    setTimeout(() => closeButton?.focus(), 0);
  }

  function closeLightbox() {
    lightbox?.classList.remove('is-open');
    lightbox?.setAttribute('aria-hidden', 'true');
    body.classList.remove('lightbox-open');
    if (lightboxImage) lightboxImage.src = '';
    lastTrigger?.focus();
  }

  workItems.forEach((item, index) => item.addEventListener('click', () => openLightbox(index, item)));
  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', () => renderLightbox(currentIndex - 1));
  nextButton?.addEventListener('click', () => renderLightbox(currentIndex + 1));
  lightbox?.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (lightbox?.classList.contains('is-open')) closeLightbox();
      else if (mobileMenu?.classList.contains('is-open')) closeMenu(true);
    }
    if (lightbox?.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') renderLightbox(currentIndex - 1);
      if (e.key === 'ArrowRight') renderLightbox(currentIndex + 1);
      if (e.key === 'Tab') {
        const focusables = [closeButton, prevButton, nextButton].filter(Boolean);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
  });

  // Very restrained parallax, disabled for reduced motion and small screens.
  const parallaxLayers = [...document.querySelectorAll('[data-parallax]')];
  let parallaxTicking = false;
  function updateParallax() {
    if (reduceMotion.matches || window.innerWidth < 760) {
      parallaxLayers.forEach(el => el.style.transform = '');
      parallaxTicking = false;
      return;
    }
    parallaxLayers.forEach(el => {
      const parent = el.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const speed = Number(el.dataset.parallax || 0);
      const centerDelta = (rect.top + rect.height / 2) - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${centerDelta * speed * -0.18}px, 0)`;
    });
    parallaxTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!parallaxTicking) {
      requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateParallax);
  updateParallax();

})();
