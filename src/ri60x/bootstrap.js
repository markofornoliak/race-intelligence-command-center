const fallback = document.querySelector('[data-webgl-fallback]');
const canvas = document.querySelector('#vehicle-canvas');

function activateFallback(message) {
  fallback.hidden = false;
  canvas.hidden = true;
  fallback.querySelector('p').textContent = message;
  document.documentElement.dataset.quality = 'mobile';
  document.querySelector('[data-performance-label]').textContent = 'Lightweight fallback';
  const workspace = document.querySelector('[data-workspace]');
  const hero = document.querySelector('[data-hero-copy]');
  const open = () => { workspace.hidden = false; hero.classList.add('is-hidden'); };
  const close = () => { workspace.hidden = true; hero.classList.remove('is-hidden'); };
  document.querySelectorAll('[data-action="enter"],[data-dock="vehicle"],[data-dock="diagnostics"],[data-dock="analysis"]').forEach((button) => button.addEventListener('click', open));
  document.querySelectorAll('[data-action="close-workspace"]').forEach((button) => button.addEventListener('click', close));
  document.querySelector('[data-action="help"]')?.addEventListener('click', () => document.querySelector('[data-help-dialog]')?.showModal());
}

try {
  await import('./app.js');
} catch (error) {
  console.error('RI-60X bootstrap failed', error);
  activateFallback('The 3D engine could not be loaded. The command interface remains available in lightweight mode.');
}
