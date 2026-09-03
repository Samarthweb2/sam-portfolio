/**
 * Main JS — Navigation, Scroll Reveals, Active Link Tracking, Real GitHub Heatmap
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

  // ─── Real Live GitHub Heatmap for @SamarthWeb2 ───
  const heatmapContainer = document.getElementById('github-heatmap-grid');
  const countEl = document.getElementById('gh-contrib-count');

  function renderDays(days) {
    if (!heatmapContainer) return;
    heatmapContainer.innerHTML = '';

    // Sort chronologically
    days.sort((a, b) => a.date.localeCompare(b.date));

    // Group into columns of 7 days (Sunday - Saturday)
    const fragment = document.createDocumentFragment();
    let currentWeek = document.createElement('div');
    currentWeek.className = 'flex flex-col gap-[2.5px]';

    days.forEach((day, index) => {
      const cell = document.createElement('div');
      cell.className = `gh-cell gh-l${Math.min(day.level, 4)}`;
      const contribText = day.count === 1 ? '1 contribution' : `${day.count} contributions`;
      cell.title = `${contribText} on ${day.date}`;
      cell.setAttribute('aria-label', cell.title);

      currentWeek.appendChild(cell);

      // Every 7 days, push the week column and start a new one
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        fragment.appendChild(currentWeek);
        currentWeek = document.createElement('div');
        currentWeek.className = 'flex flex-col gap-[2.5px]';
      }
    });

    heatmapContainer.appendChild(fragment);
  }

  function fetchRealGitHubActivity() {
    fetch('/api/github-contributions')
      .then(res => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then(data => {
        if (data && data.days && data.days.length) {
          if (countEl && data.total) {
            countEl.textContent = `${data.total} contributions in the last year`;
          }
          renderDays(data.days);
        }
      })
      .catch(err => {
        console.warn('Live GitHub fetch failed, rendering fallback:', err);
      });
  }

  // ─── Interactive Sticky Note & Card Wobble / Vibration on Click ───
  function attachWobble(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input, [role="button"]')) return;
      el.classList.remove('sticky-wobble');
      void el.offsetWidth; // trigger reflow
      el.classList.add('sticky-wobble');
    });
  }

  attachWobble('.yellow-note-card');
  attachWobble('.github-card');
  attachWobble('.polaroid-frame');

  // ─── Current Year in Footer ───
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
