const menu = document.querySelector('#mobile-menu')
const menuLinks = document.querySelector('.navbar_menu')

menu.addEventListener('click', function () {
    menu.classList.toggle('toggle');
    menuLinks.classList.toggle('active');
})

// typing effect
export function initTypingResearch(containerId, messages) {
  const container = document.getElementById(containerId);
  let textIndex = 0, charIndex = 0, isDeleting = false;

  function typeEffect() {
    const text = messages[textIndex];
    const speed = isDeleting ? 50 : 100;
    container.textContent = text.substring(0, charIndex);

    if (!isDeleting && charIndex < text.length) charIndex++;
    else if (isDeleting && charIndex > 0) charIndex--;
    else if (!isDeleting && charIndex === text.length)
      setTimeout(() => (isDeleting = true), 1000);
    else {
      isDeleting = false;
      textIndex = (textIndex + 1) % messages.length;
    }

    setTimeout(typeEffect, speed);
  }

  typeEffect();
}

document.addEventListener("DOMContentLoaded", () => {
  initTypingResearch("research-topics", [
    "Machine Learning",
    "Vector database",
    "CUDA programming",
    "High-performance computing",
    "Inference acceleration"
  ]);

  toggleMenu();
});


export function initTypingProject(containerId, messages) {
  const container = document.getElementById(containerId);
  const projectLists = document.querySelectorAll(".project_list");

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingTimeout;

  function showProjectList(topic) {
    projectLists.forEach(list => {
      const listTopic = list.getAttribute("topic");
      if (listTopic.trim().toLowerCase() === topic.trim().toLowerCase()) {
        list.classList.add("active");
      } else {
        list.classList.remove("active");
      }
    });
  }

  function typeEffect() {
    const currentText = messages[textIndex];
    const displayText = currentText.substring(0, charIndex);
    container.textContent = displayText;

    // typing speed tuning
    const typingSpeed = isDeleting ? 40 : 100;

    if (!isDeleting && charIndex < currentText.length) {
      // still typing
      charIndex++;
      typingTimeout = setTimeout(typeEffect, typingSpeed);
    }
    else if (isDeleting && charIndex > 0) {
      // deleting
      charIndex--;
      typingTimeout = setTimeout(typeEffect, typingSpeed / 1.5);
    }
    else if (!isDeleting && charIndex === currentText.length) {
      // finished typing fully
      showProjectList(currentText);
      // pause before deleting
      isDeleting = true;
      typingTimeout = setTimeout(typeEffect, 1000);
    }
    else if (isDeleting && charIndex === 0) {
      // finished deleting, move to next text
      isDeleting = false;
      textIndex = (textIndex + 1) % messages.length;
      // **delay** before next typing to prevent flicker
      typingTimeout = setTimeout(typeEffect, 250);
    }
  }

  typeEffect();
}

document.addEventListener("DOMContentLoaded", () => {
  initTypingProject("project-topics", [
    "Machine Learning",
    "Data Engineering",
    "Computer Architecture",
    "Computer System Design",
  ]);
});

(function () {
  // ========= Tunables (match your layout) =========
  const SELECTOR = '#project-container';
  const MAX_PROJ = 4;          // how many cards you plan to show
  const GUTTER_PX = 100;        // left+right gutter in px you subtract from width
  const CARD_WIDTH_VH = 40;    // card width expressed in vh (viewport-height units)
  const CARD_GAP_PX = 40;      // horizontal gap between cards
  const ROW_HEIGHT_VH = 60;    // card height in vh
  const ROW_GAP_PX = 30;       // vertical gap between rows
  const MIN_VH_THRESHOLD = 5;  // skip first pass if vh is unrealistically small
  const DEBUG = false;         // set true to log measurements
  const PROJ_LIST_WIDTH_WEIGHT = 2/3;

  // ========= Helpers =========
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  // Prefer stable window.inner* first; visualViewport can be tiny early in lifecycle
  function getViewportSize() {
    const w = window.innerWidth
          || document.documentElement.clientWidth
          || window.visualViewport?.width
          || 0;

    const h = window.innerHeight
          || document.documentElement.clientHeight
          || window.visualViewport?.height
          || 0;

    return { width: w, height: h };
  }

  function getVh() { return getViewportSize().height / 100; }
  function getVw() { return getViewportSize().width / 100; }

  

  // ========= Main =========
  onReady(() => {
    const el = document.querySelector(SELECTOR);
    if (!el) {
      console.warn('[resize] project container not found:', SELECTOR);
      return;
    }

    // Debounce with rAF to avoid thrashing on rapid events
    let rafId = null;
    function scheduleUpdate() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    }

    function update() {
      const vw = getVw();
      const vh = getVh();

      if (!Number.isFinite(vw) || !Number.isFinite(vh) || vh < MIN_VH_THRESHOLD) {
        if (DEBUG) console.log('[resize] skipping (unstable vh)', { vw, vh });
        return;
      }

      // Compute per your layout math
      const availableWidthPx = Math.max(0, 100 * vw - GUTTER_PX) * PROJ_LIST_WIDTH_WEIGHT;
      const cardWidthPx = CARD_WIDTH_VH * vh + CARD_GAP_PX;

      // At least 1 card per line
      const cardPerLine = Math.max(1, Math.floor(availableWidthPx / cardWidthPx));
      const numLines = Math.ceil(MAX_PROJ / cardPerLine);

      const rowHeightPx = ROW_HEIGHT_VH * vh + ROW_GAP_PX;
      const totalHeight = Math.max(0, Math.round(numLines * rowHeightPx)) + 40;

      // Use minHeight so real content can exceed this if needed
      el.style.setProperty('--js-min-height', `${totalHeight}px`);

      if (DEBUG) {
        console.log('[resize] update', {
          vw, vh, availableWidthPx, cardWidthPx,
          cardPerLine, numLines, rowHeightPx, totalHeight
        });
      }
    }

    // ========= Events that affect layout =========
    // 1) Classic viewport changes
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    // 2) Mobile browser UI changes visible height while scrolling
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleUpdate, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleUpdate, { passive: true });
    }

    // 3) After initial paint & assets
    requestAnimationFrame(scheduleUpdate);                        // next paint
    window.addEventListener('load', scheduleUpdate, { once: true });
    if (document.fonts?.ready) document.fonts.ready.then(scheduleUpdate);

    // 4) Observe DOM/layout changes that don’t trigger window resize
    //    (wrapping changes, alternating project lists, etc.)
    const ro = new ResizeObserver(scheduleUpdate);
    ro.observe(document.documentElement);
    if (el.parentElement) ro.observe(el.parentElement);
    ro.observe(el);

    // Content mutations (e.g., swapping lists, adding/removing cards)
    const mo = new MutationObserver(scheduleUpdate);
    mo.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });

    // 5) First measurement (in case nothing else fires immediately)
    scheduleUpdate();
  });
})();