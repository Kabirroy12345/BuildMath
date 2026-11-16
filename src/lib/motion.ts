// Dynamic pointer, scroll-scrubbing, magnetic radial fill, and kinetic typography engine
// Zero external dependencies; respects prefers-reduced-motion & coarse touch viewports.

export function initBuildMathMotion() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

  // 1. Kinetic Masked Word Reveals (keeps exact DOM textContent intact)
  const splitTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-split-reveal]'));
  splitTargets.forEach((el) => {
    if (el.dataset.splitReady === '1') return;
    const raw = (el.textContent || '').trim();
    if (!raw) return;
    el.dataset.splitReady = '1';

    const words = raw.split(/\s+/);
    el.textContent = '';
    words.forEach((word, idx) => {
      const mask = document.createElement('span');
      mask.className = 'bm-word-mask';
      const inner = document.createElement('span');
      inner.className = 'bm-word-inner';
      inner.style.transitionDelay = `${Math.min(idx * 38, 320)}ms`;
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (idx < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
  });

  if (prefersReduced) {
    splitTargets.forEach((el) => el.classList.add('is-revealed'));
  } else if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -2% 0px' }
    );
    splitTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.98) {
        requestAnimationFrame(() => el.classList.add('is-revealed'));
      } else {
        revealObs.observe(el);
      }
    });
  } else {
    splitTargets.forEach((el) => el.classList.add('is-revealed'));
  }

  // 2. Magnetic Cursor-Origin Flood + Tactile Attraction (bdsn.club craft)
  if (!prefersReduced && finePointer) {
    const magnets = document.querySelectorAll<HTMLElement>('.bm-magnetic, .bm-pill-cta');
    magnets.forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        btn.style.setProperty('--mx', `${x.toFixed(1)}px`);
        btn.style.setProperty('--my', `${y.toFixed(1)}px`);
        const dx = ((x / rect.width) - 0.5) * 6;
        const dy = ((y / rect.height) - 0.5) * 4;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // 3. Precision Pointer Reticle Follower (desktop fine-pointer only)
  const reticle = document.getElementById('bm-cursor-reticle');
  const reticleLabel = document.getElementById('bm-cursor-label');
  if (reticle && finePointer && !prefersReduced) {
    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let visible = false;
    let rafId = 0;

    const tickReticle = () => {
      curX += (targetX - curX) * 0.22;
      curY += (targetY - curY) * 0.22;
      reticle.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
        rafId = requestAnimationFrame(tickReticle);
      } else {
        rafId = 0;
      }
    };

    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        targetX = e.clientX;
        targetY = e.clientY;
        if (!visible) {
          visible = true;
          curX = targetX;
          curY = targetY;
          reticle.style.opacity = '1';
        }
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const interactive = el?.closest('[data-cursor], a, button, input, select, textarea') as HTMLElement | null;
        if (!interactive) {
          reticle.dataset.state = 'idle';
          if (reticleLabel) reticleLabel.textContent = '';
        } else if (interactive.matches('input, select, textarea')) {
          reticle.dataset.state = 'input';
          if (reticleLabel) reticleLabel.textContent = '';
        } else if (interactive.dataset.cursor === 'calc') {
          reticle.dataset.state = 'calc';
          if (reticleLabel) reticleLabel.textContent = interactive.dataset.cursorText || 'OPEN ↗';
        } else {
          reticle.dataset.state = 'action';
          if (reticleLabel) reticleLabel.textContent = '';
        }
        if (!rafId) rafId = requestAnimationFrame(tickReticle);
      },
      { passive: true }
    );

    document.addEventListener('pointerleave', () => {
      visible = false;
      reticle.style.opacity = '0';
    });
  }

  // 4. Unified Scroll Physics: Progress Bar, Orbiting Vector Stamps (velocity-reactive), & Pipeline Scrubbing
  const progressBar = document.getElementById('bm-scroll-progress');
  const stamps = Array.from(document.querySelectorAll<HTMLElement>('[data-orbit-stamp]'));
  const pipelines = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-pipeline]'));

  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let stampAngle = 0;

  const updateScrollDrivenElements = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (progressBar) {
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    // Scrubbed Methodology Pipeline (epic.net scroll choreography)
    const vh = window.innerHeight || 900;
    pipelines.forEach((pipe) => {
      const rect = pipe.getBoundingClientRect();
      // Progress reaches 1.0 nicely as section passes center of viewport
      const start = vh * 0.92;
      const end = vh * 0.26;
      const raw = (start - rect.top) / Math.max(1, start - end);
      const p = Math.min(1, Math.max(0, raw));
      pipe.style.setProperty('--pipe-progress', p.toFixed(4));

      const steps = pipe.querySelectorAll<HTMLElement>('[data-pipe-step]');
      steps.forEach((step, idx) => {
        const threshold = idx / Math.max(1, steps.length);
        step.dataset.active = p >= threshold + 0.08 ? 'true' : 'false';
      });
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      const nowY = window.scrollY;
      scrollVelocity = Math.min(24, Math.max(-24, nowY - lastScrollY));
      lastScrollY = nowY;
      updateScrollDrivenElements();
    },
    { passive: true }
  );
  updateScrollDrivenElements();

  // Continuous orbit loop ONLY for subtle rotating architectural seal stamps (pauses on hidden tab / reduced motion)
  if (!prefersReduced && stamps.length > 0) {
    let lastTime = performance.now();
    const spinLoop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (!document.hidden) {
        const velBoost = Math.abs(scrollVelocity) * 10;
        stampAngle = (stampAngle + (16 + velBoost) * dt) % 360;
        scrollVelocity *= 0.9;
        stamps.forEach((s) => {
          s.style.transform = `rotate(${stampAngle.toFixed(2)}deg)`;
        });
      }
      requestAnimationFrame(spinLoop);
    };
    requestAnimationFrame(spinLoop);
  }
}
