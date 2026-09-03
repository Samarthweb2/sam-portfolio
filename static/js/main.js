/**
 * Main JS — Navigation, Scroll Reveals, Active Link Tracking, GitHub Heatmap
 */

(function () {
  'use strict';

  // ─── Smooth Scroll for Nav Links ───
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ─── Active Nav Link Tracking (IntersectionObserver) ───
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(function (link) {
              if (link.dataset.section === id) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // ─── Scroll Reveal Animations ───
  const revealElements = document.querySelectorAll('.animate-fade-up');
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ─── Generate Realistic GitHub Heatmap (Arjun Style) ───
  const heatmapContainer = document.getElementById('github-heatmap-grid');
  if (heatmapContainer) {
    // 52 weeks x 7 days
    const weeks = 52;
    const days = 7;
    const fragment = document.createDocumentFragment();

    // Pseudo-random but deterministic pattern for active development clusters
    for (let w = 0; w < weeks; w++) {
      const col = document.createElement('div');
      col.className = 'flex flex-col gap-[2.5px]';

      for (let d = 0; d < days; d++) {
        const cell = document.createElement('div');
        cell.className = 'gh-cell';

        // Weighted density: more activity in weekdays, clusters in sprint weeks
        const isWeekend = (d === 0 || d === 6);
        const seed = (Math.sin(w * 1.3 + d * 0.7) + 1) / 2;
        const streak = Math.sin(w * 0.3) > 0.1;

        let level = 0;
        if (seed > 0.85 && !isWeekend) {
          level = 4;
        } else if (seed > 0.65 || (streak && seed > 0.5)) {
          level = 3;
        } else if (seed > 0.4) {
          level = 2;
        } else if (seed > 0.2 || (isWeekend && seed > 0.5)) {
          level = 1;
        } else {
          level = 0;
        }

        cell.classList.add('gh-l' + level);
        col.appendChild(cell);
      }
      fragment.appendChild(col);
    }
    heatmapContainer.appendChild(fragment);
  }

  // ─── Current Year in Footer ───
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
