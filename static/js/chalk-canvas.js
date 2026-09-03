/**
 * Chalk Drawing Canvas & Red Pen Annotations
 * Allows visitors to click & draw/annotate anywhere on the chalkboard with red pen/chalk by default.
 * Features: Red pen/chalk default, 3 chalk colors, eraser mode, wipe-all (double-click duster).
 */

(function () {
  'use strict';

  // ─── State ───
  let isDrawing = false;
  let currentColor = '#E35342'; // Default: Signature Orange/Red Chalk/Pen
  let brushSize = 2.5;
  let isEraser = false;
  let lastX = 0;
  let lastY = 0;
  let canvasActive = true;

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

    // Save current drawing if canvas had size
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

  // ─── Global Pointer Events (Draw on click & drag anywhere) ───
  window.addEventListener('pointerdown', function (e) {
    // Ignore interactive UI elements like links, buttons, inputs, shelf
    if (e.target.closest('a, button, input, select, textarea, .chalk-tray, [role="button"]')) {
      return;
    }

    if (!canvasActive) return;
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
  chalkButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      isEraser = false;
      currentColor = btn.dataset.chalkColor;
      brushSize = 2.5;
      canvasActive = true;

      // Highlight active chalk
      chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      document.getElementById('duster-btn')?.classList.remove('selected');

      showBubble();
    });
  });

  // Set default selected button (orange/red chalk)
  const defaultRedBtn = document.querySelector('[data-chalk-color="#E35342"]');
  if (defaultRedBtn) {
    chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
    defaultRedBtn.classList.add('selected');
  }

  // ─── Duster / Eraser ───
  const dusterBtn = document.getElementById('duster-btn');
  if (dusterBtn) {
    dusterBtn.addEventListener('click', function () {
      isEraser = true;
      chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
      dusterBtn.classList.add('selected');
    });

    dusterBtn.addEventListener('dblclick', function () {
      // Wipe everything
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      isEraser = false;
      // Re-select red chalk
      chalkButtons.forEach(function (b) { b.classList.remove('selected'); });
      if (defaultRedBtn) defaultRedBtn.classList.add('selected');
      dusterBtn.classList.remove('selected');
      currentColor = '#E35342';
    });
  }

  // ─── Bubble Message ───
  let bubbleShown = false;
  function showBubble() {
    if (bubbleShown) return;
    bubbleShown = true;
    const bubble = document.getElementById('chalk-bubble');
    if (bubble) {
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0)';
      setTimeout(function () {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(12px)';
      }, 4000);
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
