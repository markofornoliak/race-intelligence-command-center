(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const boot = document.querySelector('[data-boot]');
  const header = document.querySelector('[data-header]');
  const film = document.querySelector('[data-film]');
  const openFilm = document.querySelector('[data-open-film]');
  const closeFilm = document.querySelector('[data-close-film]');

  window.addEventListener('load', () => {
    window.setTimeout(() => boot?.classList.add('is-complete'), reducedMotion ? 0 : 850);
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 36);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const openFilmModal = () => {
    if (!film) return;
    film.showModal();
    document.body.classList.add('is-locked');
  };

  const closeFilmModal = () => {
    if (!film?.open) return;
    film.close();
    document.body.classList.remove('is-locked');
  };

  openFilm?.addEventListener('click', openFilmModal);
  closeFilm?.addEventListener('click', closeFilmModal);
  film?.addEventListener('click', (event) => {
    if (event.target === film) closeFilmModal();
  });
  film?.addEventListener('close', () => document.body.classList.remove('is-locked'));
})();
