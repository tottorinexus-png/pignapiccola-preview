(() => {
  const opening = document.getElementById('opening');
  const hasVisited = sessionStorage.getItem('pigna-opening-seen');

  const hideOpening = () => {
    if (!opening) return;
    opening.classList.add('is-hidden');
    sessionStorage.setItem('pigna-opening-seen', '1');
  };

  if (hasVisited) {
    opening?.classList.add('is-hidden');
  } else {
    window.addEventListener('load', () => window.setTimeout(hideOpening, 1150));
    window.setTimeout(hideOpening, 2400);
  }

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('global-nav');

  const closeNav = () => {
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'メニューを開く');
    nav?.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'メニューを開く' : 'メニューを閉じる');
    nav?.classList.toggle('is-open', !open);
    document.body.style.overflow = open ? '' : 'hidden';
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();
