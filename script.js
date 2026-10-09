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

const filters = document.querySelectorAll('.filter');
const services = document.querySelectorAll('.service');
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selected = filter.dataset.filter;
    filters.forEach((item) => item.setAttribute('aria-selected', String(item === filter)));
    services.forEach((service) => service.dataset.hidden = selected !== 'all' && service.dataset.type !== selected);
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
