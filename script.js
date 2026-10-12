const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const aboutMore = document.querySelector('#about-more');
const aboutKicker = document.querySelector('.about-copy .kicker');
const aboutMoreOpen = document.querySelector('.about-more-open');
const aboutMoreClose = document.querySelector('.about-more-close');
const setAboutMoreState = (isExpanded) => {
  aboutMore.setAttribute('aria-hidden', String(!isExpanded));
  aboutMoreOpen.setAttribute('aria-expanded', String(isExpanded));
  aboutMoreClose.setAttribute('aria-expanded', String(isExpanded));
  aboutMoreOpen.classList.toggle('is-hidden', isExpanded);
  aboutMoreClose.hidden = !isExpanded;
  // Animate between 0 and the real content height so expand and collapse both start immediately.
  aboutMore.style.maxHeight = `${aboutMore.scrollHeight}px`;
  if (isExpanded) {
    aboutMore.classList.add('is-open');
  } else {
    aboutMore.offsetHeight;
    aboutMore.classList.remove('is-open');
    aboutMore.style.maxHeight = '0px';
  }
};
aboutMore.addEventListener('transitionend', (event) => {
  // Let the open content reflow freely on resize or rotation.
  if (event.propertyName === 'max-height' && aboutMore.classList.contains('is-open')) aboutMore.style.maxHeight = 'none';
});
aboutMoreOpen.addEventListener('click', () => {
  setAboutMoreState(true);
  aboutMoreClose.focus({ preventScroll: true });
  window.setTimeout(() => {
    const targetPosition = aboutMore.getBoundingClientRect().top + window.scrollY - 28;
    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
  }, 100);
});
aboutMoreClose.addEventListener('click', () => {
  setAboutMoreState(false);
  aboutMoreOpen.focus({ preventScroll: true });
  // Only scroll up when the heading is above the viewport, leaving a small breathing space.
  const kickerTop = aboutKicker.getBoundingClientRect().top;
  if (kickerTop < 24) window.scrollTo({ top: kickerTop + window.scrollY - 24, behavior: 'smooth' });
});

const filters = document.querySelectorAll('.filter');
const services = document.querySelectorAll('.service-item');
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selected = filter.dataset.filter;
    filters.forEach((item) => item.setAttribute('aria-selected', String(item === filter)));
    services.forEach((service) => service.dataset.hidden = selected !== 'all' && service.dataset.type !== selected);
  });
});

const serviceCards = document.querySelectorAll('.service');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let lastPointerType = 'mouse';
let openServiceButton = null;
const detailsDuration = 420;
const detailsEasing = 'cubic-bezier(.25, .8, .25, 1)';
const getServiceDetails = (button) => document.getElementById(button.getAttribute('aria-controls'));
// Animate a panel's height (and fade) between two values; the final state comes from its classes.
const animateServiceDetails = (details, from, to) => {
  details.getAnimations().forEach((animation) => animation.cancel());
  if (reduceMotion.matches) return null;
  return details.animate(
    [{ height: `${from}px`, opacity: from ? 1 : 0 }, { height: `${to}px`, opacity: to ? 1 : 0 }],
    { duration: detailsDuration, easing: detailsEasing, fill: to ? 'none' : 'forwards' }
  );
};
const collapseServiceDetails = (button, fromHeight) => {
  const details = getServiceDetails(button);
  button.setAttribute('aria-expanded', 'false');
  details.classList.remove('is-open');
  details.classList.add('is-closing');
  const animation = animateServiceDetails(details, fromHeight, 0);
  const finish = () => {
    details.classList.remove('is-closing');
    details.getAnimations().forEach((item) => item.cancel());
  };
  if (animation) animation.onfinish = finish;
  else finish();
  if (openServiceButton === button) openServiceButton = null;
};
// Where to scroll so the whole panel is visible, keeping its top at least 80px below the viewport edge.
const getServiceDetailsScrollTarget = (details) => {
  const rect = details.getBoundingClientRect();
  const topGap = 80;
  const bottomGap = 24;
  let delta = 0;
  if (rect.bottom > window.innerHeight - bottomGap) delta = Math.min(rect.bottom - window.innerHeight + bottomGap, rect.top - topGap);
  else if (rect.top < topGap) delta = rect.top - topGap;
  return delta ? window.scrollY + delta : null;
};
const openServiceDetails = (button) => {
  const details = getServiceDetails(button);
  const previousButton = openServiceButton;
  const previousDetails = previousButton && getServiceDetails(previousButton);
  // Measure current (possibly mid-animation) heights before changing any state.
  const fromHeight = details.classList.contains('is-closing') ? details.getBoundingClientRect().height : 0;
  const previousHeight = previousDetails ? previousDetails.getBoundingClientRect().height : 0;
  details.getAnimations().forEach((animation) => animation.cancel());
  if (previousDetails) {
    previousDetails.getAnimations().forEach((animation) => animation.cancel());
    previousDetails.classList.remove('is-open', 'is-closing');
    previousButton.setAttribute('aria-expanded', 'false');
  }
  details.classList.remove('is-closing');
  details.classList.add('is-open');
  button.setAttribute('aria-expanded', 'true');
  openServiceButton = button;
  // Layout is now in its final state: work out the scroll target before the animations start.
  const toHeight = details.getBoundingClientRect().height;
  const scrollTarget = getServiceDetailsScrollTarget(details);
  if (previousDetails) collapseServiceDetails(previousButton, previousHeight);
  const animation = animateServiceDetails(details, fromHeight, toHeight);
  if (scrollTarget === null) return;
  if (!animation) {
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
    return;
  }
  // Stop the browser's scroll anchoring from fighting the smooth scroll while heights change.
  document.documentElement.style.overflowAnchor = 'none';
  window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  animation.finished.catch(() => {}).finally(() => { document.documentElement.style.overflowAnchor = ''; });
};
serviceCards.forEach((card) => {
  const moreButton = card.querySelector('.service-more');
  card.addEventListener('pointerdown', (event) => { lastPointerType = event.pointerType; });
  // Touch has no hover, so tapping the card (outside the button) toggles the blur and the button.
  card.addEventListener('click', (event) => {
    if (lastPointerType === 'mouse' || event.target.closest('.service-more')) return;
    const isActive = card.classList.toggle('is-active');
    if (isActive) serviceCards.forEach((other) => { if (other !== card) other.classList.remove('is-active'); });
  });
  moreButton.addEventListener('click', () => {
    if (openServiceButton === moreButton) collapseServiceDetails(moreButton, getServiceDetails(moreButton).getBoundingClientRect().height);
    else openServiceDetails(moreButton);
  });
});

const partnerCarousel = document.querySelector('.partner-carousel');
const partnerViewport = partnerCarousel.querySelector('.partner-viewport');
const partnerTrack = partnerCarousel.querySelector('.partner-track');
const partnerLogos = Array.from(partnerTrack.querySelectorAll('.partner-logo'));
const partnerSpeed = 36; // px per second
const partnerResumeDelay = 3500;
const partnerStepDuration = 520;
let partnerStep = 0;
let partnerSetWidth = 0;
let partnerOffset = 0;
let partnerVelocity = 0;
let partnerTween = null;
let partnerDrag = null;
let partnerHovered = false;
let partnerKeyboardFocus = false;
let partnerHoldUntil = 0;
let partnerFrame = null;
let partnerLastTime = null;
const wrapPartnerOffset = (value) => ((value % partnerSetWidth) + partnerSetWidth) % partnerSetWidth;
const renderPartners = () => { partnerTrack.style.transform = `translate3d(${-partnerOffset}px, 0, 0)`; };
// Tiles share one width, so a whole set is (tile + gap) × count. Enough hidden copies follow it to fill the
// viewport at any offset, which lets the track wrap back to the start without a visible jump.
const measurePartners = () => {
  const gap = parseFloat(getComputedStyle(partnerTrack).columnGap) || 0;
  const step = partnerLogos[0].getBoundingClientRect().width + gap;
  if (partnerStep) partnerOffset = partnerOffset / partnerStep * step;
  partnerStep = step;
  partnerSetWidth = step * partnerLogos.length;
  const copies = Math.max(1, Math.ceil(partnerViewport.clientWidth / partnerSetWidth));
  const clones = partnerTrack.querySelectorAll('.partner-logo[aria-hidden="true"]');
  if (clones.length !== copies * partnerLogos.length) {
    clones.forEach((clone) => clone.remove());
    for (let copy = 0; copy < copies; copy += 1) {
      partnerLogos.forEach((logo) => {
        const clone = logo.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
        clone.querySelectorAll('a, button').forEach((item) => item.setAttribute('tabindex', '-1'));
        partnerTrack.appendChild(clone);
      });
    }
  }
  partnerOffset = wrapPartnerOffset(partnerOffset);
  renderPartners();
};
const isPartnerPaused = (now) => reduceMotion.matches || partnerHovered || partnerKeyboardFocus || partnerDrag || partnerTween || now < partnerHoldUntil;
const holdPartners = () => { partnerHoldUntil = performance.now() + partnerResumeDelay; };
const easeInOutCubic = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const getPartnerTweenPosition = (now) => {
  const progress = Math.min((now - partnerTween.start) / partnerStepDuration, 1);
  return { progress, position: partnerTween.from + (partnerTween.to - partnerTween.from) * easeInOutCubic(progress) };
};
const tickPartners = (now) => {
  const elapsed = partnerLastTime === null ? 0 : Math.min(now - partnerLastTime, 64);
  partnerLastTime = now;
  if (partnerTween) {
    const { progress, position } = getPartnerTweenPosition(now);
    partnerOffset = wrapPartnerOffset(position);
    if (progress === 1) partnerTween = null;
  } else if (!partnerDrag) {
    // Ease the speed up and down so pausing and resuming never look abrupt.
    const target = isPartnerPaused(now) ? 0 : partnerSpeed;
    partnerVelocity += (target - partnerVelocity) * Math.min(1, elapsed / 260);
    if (target === 0 && partnerVelocity < .5) partnerVelocity = 0;
    partnerOffset = wrapPartnerOffset(partnerOffset + partnerVelocity * elapsed / 1000);
  }
  renderPartners();
  partnerFrame = requestAnimationFrame(tickPartners);
};
const startPartners = () => {
  if (partnerFrame !== null) return;
  partnerLastTime = null;
  partnerFrame = requestAnimationFrame(tickPartners);
};
const stopPartners = () => {
  if (partnerFrame === null) return;
  cancelAnimationFrame(partnerFrame);
  partnerFrame = null;
};
// Move one logo per click, aligned to the tile edges; quick repeated clicks add further steps.
const movePartners = (direction) => {
  holdPartners();
  partnerVelocity = 0;
  if (reduceMotion.matches) {
    partnerTween = null;
    partnerOffset = wrapPartnerOffset((Math.round(partnerOffset / partnerStep) + direction) * partnerStep);
    renderPartners();
    return;
  }
  const now = performance.now();
  const from = partnerTween ? getPartnerTweenPosition(now).position : partnerOffset;
  const base = partnerTween ? partnerTween.to : Math.round(partnerOffset / partnerStep) * partnerStep;
  partnerTween = { from, to: base + direction * partnerStep, start: now };
};
partnerCarousel.querySelector('.carousel-control.prev').addEventListener('click', () => movePartners(-1));
partnerCarousel.querySelector('.carousel-control.next').addEventListener('click', () => movePartners(1));
partnerCarousel.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  movePartners(event.key === 'ArrowLeft' ? -1 : 1);
});
// Keyboard focus pauses the motion; mouse and touch clicks on the buttons use the timed hold instead.
partnerCarousel.addEventListener('focusin', (event) => { partnerKeyboardFocus = event.target.matches(':focus-visible'); });
partnerCarousel.addEventListener('focusout', (event) => {
  if (partnerCarousel.contains(event.relatedTarget)) return;
  partnerKeyboardFocus = false;
  holdPartners();
});
partnerViewport.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') partnerHovered = true; });
partnerViewport.addEventListener('pointerleave', (event) => {
  if (event.pointerType !== 'mouse') return;
  partnerHovered = false;
  holdPartners();
});
// Pressing or tapping a logo pauses the motion; dragging sideways moves the logos by hand.
partnerViewport.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  holdPartners();
  partnerTween = null;
  partnerVelocity = 0;
  partnerDrag = { id: event.pointerId, startX: event.clientX, startOffset: partnerOffset, moved: false };
});
partnerViewport.addEventListener('pointermove', (event) => {
  if (!partnerDrag || event.pointerId !== partnerDrag.id) return;
  const distance = event.clientX - partnerDrag.startX;
  if (!partnerDrag.moved && Math.abs(distance) < 6) return;
  if (!partnerDrag.moved) {
    partnerDrag.moved = true;
    partnerViewport.setPointerCapture(event.pointerId);
    partnerViewport.classList.add('is-dragging');
  }
  partnerOffset = wrapPartnerOffset(partnerDrag.startOffset - distance);
});
const endPartnerDrag = (event) => {
  if (!partnerDrag || event.pointerId !== partnerDrag.id) return;
  const wasMoved = partnerDrag.moved;
  partnerDrag = null;
  partnerViewport.classList.remove('is-dragging');
  holdPartners();
  // A drag should not also open a logo link when the pointer is released over it.
  if (wasMoved) partnerViewport.addEventListener('click', (click) => { click.preventDefault(); click.stopPropagation(); }, { capture: true, once: true });
};
window.addEventListener('pointerup', endPartnerDrag);
window.addEventListener('pointercancel', endPartnerDrag);
// Only animate while the carousel is near the screen, and load its logos just before it comes into view.
new IntersectionObserver((entries) => {
  if (entries[entries.length - 1].isIntersecting) {
    partnerTrack.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    startPartners();
  } else {
    stopPartners();
  }
}, { rootMargin: '200px 0px' }).observe(partnerCarousel);
measurePartners();
window.addEventListener('resize', measurePartners);

document.querySelector('#current-year').textContent = new Date().getFullYear();

const toast = document.querySelector('.toast');
document.querySelector('#copy-email').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('info@targsys.com');
    toast.textContent = 'Էլ․ փոստը պատճենվեց։';
  } catch (error) {
    toast.textContent = 'info@targsys.com';
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
