
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


  // Horizontal information deck.
  // Desktop maps ordinary vertical scroll progress to horizontal chapter movement.
  // Mobile and reduced-motion use native horizontal scroll-snap instead.
  const storySection = document.getElementById('story');
  const storyViewport = document.getElementById('story-viewport');
  const storyTrack = document.getElementById('story-track');
  const storyPanels = [...document.querySelectorAll('.story-panel')];
  const storyTabs = [...document.querySelectorAll('[data-story-tab]')];
  const storyPrev = document.getElementById('story-prev');
  const storyNext = document.getElementById('story-next');
  const panoramaLayers = [...document.querySelectorAll('.panorama-layer')];
  const panoramaName = document.getElementById('panorama-name');
  const panoramaProgress = document.getElementById('panorama-progress');
  const storyLive = document.getElementById('story-live');
  const storyProgressFill = document.getElementById('story-progress-fill');
  const storyProgressLabel = document.getElementById('story-progress-label');
  const storyProgressTrack = document.getElementById('story-progress-track');
  const storySideScroll = document.getElementById('story-side-scroll');
  const storySideThumb = document.getElementById('story-side-thumb');
  const desktopStory = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  const chapterNames = ['Process', 'Services', 'About', 'Notes', 'FAQ'];
  let storyIndex = 0;
  let storyRaf = 0;
  let mobileScrollTimer = 0;
  let lastStoryScrollY = window.scrollY;
  let frozenUpwardChapterFloat = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function setStoryIndex(index, announce = false) {
    const next = clamp(index, 0, storyPanels.length - 1);
    storyIndex = next;

    storyTabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === next);
      tab.setAttribute('aria-selected', String(i === next));
    });

    panoramaLayers.forEach((layer, i) => layer.classList.toggle('is-active', i === next));

    const activePanorama = panoramaLayers[next];
    if (panoramaName && activePanorama) panoramaName.textContent = activePanorama.dataset.name || '';

    if (storyPrev) storyPrev.disabled = next === 0;
    if (storyNext) storyNext.disabled = next === storyPanels.length - 1;
    if (storyProgressLabel && !desktopStory.matches) {
      const pct = storyPanels.length <= 1 ? 100 : Math.round((next / (storyPanels.length - 1)) * 100);
      storyProgressLabel.textContent = `${String(next + 1).padStart(2, '0')} / ${String(storyPanels.length).padStart(2, '0')} · ${chapterNames[next]} · ${pct}%`;
    }

    if (announce && storyLive) {
      storyLive.textContent = `Chapter ${next + 1} of ${storyPanels.length}: ${chapterNames[next]}`;
    }
  }

  function updatePanoramaScrub(chapterFloat, overallProgress) {
    panoramaLayers.forEach((layer, i) => {
      const distance = Math.abs(chapterFloat - i);
      const opacity = clamp(1 - distance, 0, 1);
      layer.style.opacity = String(opacity);

      const img = layer.querySelector('img');
      if (img) {
        const local = clamp(chapterFloat - i, -1, 1);
        const drift = (overallProgress - .5) * -7 + local * -2.5;
        img.style.transform = `translate3d(${drift}%,0,0) scale(1.055)`;
      }
    });
    const percent = clamp(overallProgress * 100, 0, 100);
    if (panoramaProgress) panoramaProgress.style.width = `${percent}%`;
    if (storyProgressFill) storyProgressFill.style.width = `${percent}%`;
    if (storyProgressTrack) storyProgressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
    if (storyProgressLabel) {
      const nearest = clamp(Math.round(chapterFloat), 0, storyPanels.length - 1);
      storyProgressLabel.textContent = `${String(nearest + 1).padStart(2, '0')} / ${String(storyPanels.length).padStart(2, '0')} · ${chapterNames[nearest]} · ${Math.round(percent)}%`;
    }
  }

  function storyMetrics() {
    if (!storySection) return null;
    const safeTop = desktopStory.matches
      ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--story-safe-top')) || 0
      : 0;
    // Pinning starts when the story reaches the protected space below the fixed header,
    // and ends exactly when the sticky element must release at the section bottom.
    const start = storySection.offsetTop - safeTop;
    const end = storySection.offsetTop + storySection.offsetHeight - window.innerHeight;
    const range = Math.max(1, end - start);
    return { start, end, range, safeTop };
  }

  function updateSideScroll(progress) {
    if (!storySideScroll || !storySideThumb) return;
    const usable = Math.max(0, storySideScroll.clientHeight - 34 - storySideThumb.offsetHeight);
    storySideThumb.style.transform = `translateY(${usable * clamp(progress, 0, 1)}px)`;
  }

  function updateProgressOnly(progress) {
    const percent = clamp(progress * 100, 0, 100);
    if (panoramaProgress) panoramaProgress.style.width = `${percent}%`;
    if (storyProgressFill) storyProgressFill.style.width = `${percent}%`;
    if (storyProgressTrack) storyProgressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
    if (storyProgressLabel) {
      storyProgressLabel.textContent = `${String(storyIndex + 1).padStart(2, '0')} / ${String(storyPanels.length).padStart(2, '0')} · ${chapterNames[storyIndex]} · ${Math.round(percent)}%`;
    }
    updateSideScroll(progress);
  }

  function updateDesktopStory() {
    if (!storySection || !storyTrack || !desktopStory.matches) return;
    const metrics = storyMetrics();
    const now = window.scrollY;
    const progress = clamp((now - metrics.start) / metrics.range, 0, 1);
    const movingUp = now < lastStoryScrollY - 1;
    const insidePinnedRange = now > metrics.start && now < metrics.end;
    const maxX = Math.max(0, storyTrack.scrollWidth - window.innerWidth);

    // Downward travel advances the horizontal narrative. On the return trip,
    // ordinary vertical scrolling keeps moving upward while the horizontal
    // deck stays put, so the user never has to scrub five panels backwards.
    if (!(movingUp && insidePinnedRange)) {
      const chapterFloat = progress * (storyPanels.length - 1);
      frozenUpwardChapterFloat = chapterFloat;
      storyTrack.style.transform = `translate3d(${-maxX * progress}px,0,0)`;
      const nearest = Math.round(chapterFloat);
      if (nearest !== storyIndex) setStoryIndex(nearest);
      updatePanoramaScrub(chapterFloat, progress);
    } else {
      updateProgressOnly(progress);
    }

    updateSideScroll(progress);
    lastStoryScrollY = now;
  }

  function scrollToStoryChapter(index) {
    const next = clamp(index, 0, storyPanels.length - 1);
    setStoryIndex(next, true);

    if (desktopStory.matches) {
      const metrics = storyMetrics();
      const fraction = storyPanels.length <= 1 ? 0 : next / (storyPanels.length - 1);
      window.scrollTo({ top: metrics.start + metrics.range * fraction, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    } else {
      const panel = storyPanels[next];
      if (panel && storyViewport) {
        storyViewport.scrollTo({ left: panel.offsetLeft - storyTrack.offsetLeft, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
    }
  }

  storyTabs.forEach(tab => tab.addEventListener('click', () => scrollToStoryChapter(Number(tab.dataset.storyTab))));
  storyPrev?.addEventListener('click', () => scrollToStoryChapter(storyIndex - 1));
  storyNext?.addEventListener('click', () => scrollToStoryChapter(storyIndex + 1));

  storyViewport?.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToStoryChapter(storyIndex - 1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToStoryChapter(storyIndex + 1);
    }
  });

  storyViewport?.addEventListener('scroll', () => {
    if (desktopStory.matches) return;
    window.clearTimeout(mobileScrollTimer);
    mobileScrollTimer = window.setTimeout(() => {
      const center = storyViewport.scrollLeft + storyViewport.clientWidth / 2;
      let closest = 0;
      let closestDistance = Infinity;
      storyPanels.forEach((panel, i) => {
        const panelCenter = panel.offsetLeft + panel.offsetWidth / 2;
        const distance = Math.abs(center - panelCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      });
      setStoryIndex(closest);
      const mobileProgress = storyPanels.length <= 1 ? 0 : closest / (storyPanels.length - 1);
      updatePanoramaScrub(closest, mobileProgress);
    }, 80);
  }, { passive: true });

  function requestStoryUpdate() {
    if (!desktopStory.matches || storyRaf) return;
    storyRaf = requestAnimationFrame(() => {
      updateDesktopStory();
      storyRaf = 0;
    });
  }

  window.addEventListener('scroll', requestStoryUpdate, { passive: true });
  window.addEventListener('resize', () => {
    if (desktopStory.matches) {
      updateDesktopStory();
    } else {
      if (storyTrack) storyTrack.style.transform = 'none';
      setStoryIndex(storyIndex);
    }
  });

  if (desktopStory.addEventListener) {
    desktopStory.addEventListener('change', () => {
      if (desktopStory.matches) updateDesktopStory();
      else {
        if (storyTrack) storyTrack.style.transform = 'none';
        setStoryIndex(storyIndex);
      }
    });
  }

  setStoryIndex(0);
  if (storyProgressFill) storyProgressFill.style.width = '0%';
  updatePanoramaScrub(0, 0);
  updateSideScroll(0);
  if (desktopStory.matches) updateDesktopStory();


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
