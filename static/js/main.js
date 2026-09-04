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
        console.warn('Live GitHub fetch failed:', err);
        // If heatmap has no cells rendered, display clean fallback message
        if (heatmapContainer && !heatmapContainer.querySelector('.gh-cell')) {
          heatmapContainer.innerHTML = `
            <div class="py-6 px-4 text-center text-xs text-stone-500 font-sans w-full">
              Live GitHub activity currently unavailable. View recent activity directly on
              <a href="https://github.com/SamarthWeb2" target="_blank" rel="noopener noreferrer" class="text-[#E35342] underline font-medium hover:opacity-80">GitHub (@SamarthWeb2)</a>.
            </div>
          `;
        }
      });
  }

  // ─── Tactile Click Animations (Polaroid Spring & Sticky Note Peel) ───
  const polaroidEl = document.querySelector('.polaroid-frame');
  if (polaroidEl) {
    polaroidEl.addEventListener('click', function (e) {
      if (e.target.closest('a, button, [role="button"]')) return;
      polaroidEl.classList.remove('clicked');
      void polaroidEl.offsetWidth; // trigger reflow
      polaroidEl.classList.add('clicked');
    });
  }

  const note = document.getElementById('yellow-sticky-note') || document.querySelector('.yellow-note-card');
  if (note) {
    const wobbleNote = () => {
      note.classList.remove('note-wobble');
      void note.offsetWidth; // Force synchronous reflow so animation restarts every time cursor re-enters
      note.classList.add('note-wobble');
    };

    // Trigger on cursor entry (desktop) and touch (mobile)
    note.addEventListener('pointerenter', wobbleNote);

    // Trigger on keyboard focus for accessibility
    note.addEventListener('focus', wobbleNote);

    // Clean up class on animationend so it doesn't wobble continuously while hovered
    note.addEventListener('animationend', (e) => {
      if (e.animationName === 'noteWobble') {
        note.classList.remove('note-wobble');
      }
    });
  }

  const githubCardEl = document.querySelector('.github-card');
  if (githubCardEl) {
    const wobbleGithubCard = () => {
      githubCardEl.classList.remove('github-card-wobble');
      void githubCardEl.offsetWidth; // Force synchronous reflow so animation restarts every time
      githubCardEl.classList.add('github-card-wobble');
    };

    // Desktop: wobble once when cursor enters the card
    githubCardEl.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') {
        wobbleGithubCard();
      }
    });

    // Mobile: wobble once when user touches the card
    githubCardEl.addEventListener('touchstart', wobbleGithubCard, { passive: true });

    // Accessibility: keyboard focus
    githubCardEl.addEventListener('focusin', wobbleGithubCard);

    // Clean up class on animation completion
    githubCardEl.addEventListener('animationend', (e) => {
      if (e.animationName === 'githubCardWobble' || e.animationName === 'ghCardWobble') {
        githubCardEl.classList.remove('github-card-wobble');
      }
    });
  }

  // ─── Education Card Wobble Interaction ───
  const educationCardEl = document.querySelector('.education-taped-card');
  if (educationCardEl) {
    const wobbleEducationCard = () => {
      educationCardEl.classList.remove('education-card-wobble');
      void educationCardEl.offsetWidth; // Force synchronous reflow so animation restarts every time
      educationCardEl.classList.add('education-card-wobble');
    };

    // Desktop: wobble once when cursor enters the card
    educationCardEl.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') {
        wobbleEducationCard();
      }
    });

    // Mobile: wobble once when user touches the card
    educationCardEl.addEventListener('touchstart', wobbleEducationCard, { passive: true });

    // Accessibility: keyboard focus
    educationCardEl.addEventListener('focusin', wobbleEducationCard);

    // Clean up class on animation completion
    educationCardEl.addEventListener('animationend', (e) => {
      if (e.animationName === 'educationCardWobble') {
        educationCardEl.classList.remove('education-card-wobble');
      }
    });
  }

  // ─── Interactive Chalk Loaf-Cat Doodle (Pet the Cat) ───
  const chalkCatBtn = document.getElementById('chalk-cat');
  const chalkCatMsg = document.getElementById('chalk-cat-msg');

  if (chalkCatBtn) {
    const petTheCat = function (e) {
      if (e && e.type === 'click') {
        // Normal click
      }

      // Re-trigger playful cat response using class removal, forced reflow, and re-adding
      chalkCatBtn.classList.remove('cat-petting');
      void chalkCatBtn.offsetWidth; // forced reflow
      chalkCatBtn.classList.add('cat-petting');

      // Re-trigger handwritten chalk message: grr... meow!
      if (chalkCatMsg) {
        chalkCatMsg.classList.remove('active');
        void chalkCatMsg.offsetWidth; // forced reflow
        chalkCatMsg.classList.add('active');
      }
    };

    chalkCatBtn.addEventListener('click', petTheCat);

    chalkCatBtn.addEventListener('animationend', function (e) {
      if (e.animationName === 'chalkCatBounce') {
        chalkCatBtn.classList.remove('cat-petting');
      }
    });

    if (chalkCatMsg) {
      chalkCatMsg.addEventListener('animationend', function (e) {
        if (e.animationName === 'chalkCatMsgFade') {
          chalkCatMsg.classList.remove('active');
        }
      });
    }
  }

  // ─── Current Year in Footer ───
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
