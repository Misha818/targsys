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
const nextPartnerButton = document.querySelector('.carousel-control.next');
const partnerLogoTemplates = Array.from(document.querySelectorAll('.partner-logo')).map((logo) => logo.cloneNode(true));
let partnerPages = [];
const partnerStatus = document.querySelector('.carousel-status');
let partnerPageIndex = 0;
let partnerGroupSize = 0;
const getPartnerGroupSize = () => window.innerWidth <= 560 ? 4 : window.innerWidth <= 900 ? 6 : 10;
const buildPartnerPages = () => {
  const nextGroupSize = getPartnerGroupSize();
  if (nextGroupSize === partnerGroupSize) return;
  partnerGroupSize = nextGroupSize;
  partnerCarousel.querySelectorAll('.partner-page').forEach((page) => page.remove());
  for (let start = 0; start < partnerLogoTemplates.length; start += partnerGroupSize) {
    const page = document.createElement('div');
    page.className = 'partner-page';
    partnerLogoTemplates.slice(start, start + partnerGroupSize).forEach((logo) => page.appendChild(logo.cloneNode(true)));
    partnerCarousel.insertBefore(page, nextPartnerButton);
  }
  partnerPages = partnerCarousel.querySelectorAll('.partner-page');
  partnerPageIndex = 0;
};
const showPartnerPage = (index) => {
  partnerPageIndex = (index + partnerPages.length) % partnerPages.length;
  partnerPages.forEach((page, pageIndex) => page.classList.toggle('active', pageIndex === partnerPageIndex));
  partnerStatus.textContent = `${partnerPageIndex + 1} / ${partnerPages.length}`;
};
buildPartnerPages();
showPartnerPage(0);
document.querySelector('.carousel-control.prev').addEventListener('click', () => showPartnerPage(partnerPageIndex - 1));
document.querySelector('.carousel-control.next').addEventListener('click', () => showPartnerPage(partnerPageIndex + 1));
window.addEventListener('resize', () => {
  const previousGroupSize = partnerGroupSize;
  buildPartnerPages();
  if (previousGroupSize !== partnerGroupSize) showPartnerPage(0);
});

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
