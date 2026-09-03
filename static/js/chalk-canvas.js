/**
 * Chalk Drawing Canvas & Red Pen Annotations
 * Allows visitors to activate chalk drawing mode from the shelf.
 * When not active, user has normal cursor. When chalk is selected, cursor switches to chalk crosshair.
 */

(function () {
  'use strict';

  // ─── State ───
  let isDrawing = false;
  let currentColor = '#E35342'; // Signature Red Chalk/Pen
  let brushSize = 2.5;
  let isEraser = false;
  let lastX = 0;
  let lastY = 0;
  let canvasActive = false; // Inactive by default so normal cursor is preserved

  // ─── DOM ───
  const canvas = document.getElementById('chalk-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ─── Resize ───
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );

    let tempCanvas;
    if (canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    if (tempCanvas) {
      ctx.drawImage(tempCanvas, 0, 0, w, h);
    }
  }

  resize();
  window.addEventListener('resize', debounce(resize, 200));

  // ─── Chalk & Pen Texture Drawing ───
  function drawChalkStroke(x, y) {
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }

    ctx.save();
    // Solid core line
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();

    // Natural chalk grain particles around edge
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (brushSize * 1.6);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      const dotSize = Math.random() * 1.2 + 0.3;

      ctx.globalAlpha = Math.random() * 0.45 + 0.2;
      ctx.beginPath();
      ctx.arc(px, py, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLine(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(Math.floor(dist / 2), 1);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      drawChalkStroke(x, y);
    }
  }

  // ─── Event Position Helper ───
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // ─── Drawing Events (Active when chalk or eraser is chosen) ───
  window.addEventListener('pointerdown', function (e) {
    if (!canvasActive) return;

    // Don't draw when clicking links, buttons, inputs, chalk-tray
    if (e.target.closest('a, button, input, select, textarea, .chalk-tray, [role="button"]')) {
      return;
    }

    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    drawChalkStroke(pos.x, pos.y);
  }, { passive: true });

  window.addEventListener('pointermove', function (e) {
    if (!isDrawing || !canvasActive) return;
    const pos = getPos(e);
    drawLine(lastX, lastY, pos.x, pos.y);
    lastX = pos.x;
    lastY = pos.y;
  }, { passive: true });

  window.addEventListener('pointerup', function () { isDrawing = false; });
  window.addEventListener('pointercancel', function () { isDrawing = false; });

  // ─── Chalk Shelf Selection ───
  const chalkButtons = document.querySelectorAll('[data-chalk-color]');
  const dusterBtn = document.getElementById('duster-btn');

  chalkButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const color = btn.dataset.chalkColor;

      // If already active with this color, toggle OFF
      if (canvasActive && !isEraser && currentColor === color) {
        canvasActive = false;
        canvas.classList.remove('active', 'eraser-mode');
        btn.classList.remove('selected');
        hideBubble();
        return;
      }

      // Activate drawing mode with chosen color
      isEraser = false;
      currentColor = color;
      brushSize = 2.5;
      canvasActive = true;
      canvas.classList.add('active');
      canvas.classList.remove('eraser-mode');

      chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
      dusterBtn?.classList.remove('selected');
      btn.classList.add('selected');

      const colorName = color === '#E35342' ? 'Red' : color === '#F2C94C' ? 'Yellow' : 'White';
      showBubble(`${colorName} chalk active! Click & drag anywhere to annotate :)`);
    });
  });

  // ─── Duster / Eraser ───
  if (dusterBtn) {
    dusterBtn.addEventListener('click', function () {
      if (canvasActive && isEraser) {
        // Toggle off
        canvasActive = false;
        isEraser = false;
        canvas.classList.remove('active', 'eraser-mode');
        dusterBtn.classList.remove('selected');
        hideBubble();
        return;
      }

      isEraser = true;
      canvasActive = true;
      canvas.classList.add('active', 'eraser-mode');

      chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
      dusterBtn.classList.add('selected');
      showBubble('Eraser active! Click & drag to erase chalk lines.');
    });

    dusterBtn.addEventListener('dblclick', function () {
      // Wipe all
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      isEraser = false;
      canvasActive = false;
      canvas.classList.remove('active', 'eraser-mode');
      chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
      dusterBtn.classList.remove('selected');
      showBubble('Board wiped clean!');
      setTimeout(hideBubble, 1800);
    });
  }

  // ─── Bubble Message ───
  let bubbleTimer = null;
  function showBubble(msg) {
    const bubble = document.getElementById('chalk-bubble');
    if (!bubble) return;
    const textEl = bubble.querySelector('.chalk-bubble');
    if (textEl && msg) {
      textEl.textContent = msg;
    }
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateY(0)';

    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, 3500);
  }

  function hideBubble() {
    const bubble = document.getElementById('chalk-bubble');
    if (bubble) {
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(12px)';
    }
  }

  function debounce(fn, ms) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }
})();
