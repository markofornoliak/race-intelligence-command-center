const fallback = document.querySelector('[data-webgl-fallback]');
const canvas = document.querySelector('#vehicle-canvas');

function openWorkspace(tab = 'control') {
  const workspace = document.querySelector('[data-workspace]');
  const hero = document.querySelector('[data-hero-copy]');
  workspace.hidden = false;
  hero.classList.add('is-hidden');
  document.querySelectorAll('[data-workspace-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.workspaceTab === tab));
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
  document.querySelectorAll('[data-dock]').forEach((button) => button.classList.toggle('is-active', (tab === 'control' && button.dataset.dock === 'vehicle') || button.dataset.dock === tab));
}

function closeWorkspace() {
  document.querySelector('[data-workspace]').hidden = true;
  document.querySelector('[data-hero-copy]').classList.remove('is-hidden');
}

function syncMode(mode) {
  const labels = { studio: 'Studio', technical: 'Technical', cfd: 'CFD', thermal: 'Thermal', dynamics: 'Dynamics' };
  document.documentElement.dataset.mode = mode;
  document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.mode === mode));
  document.querySelector('[data-view-label]').textContent = labels[mode] || mode;
  document.querySelector('[data-panel-title]').textContent = labels[mode] || mode;
  document.querySelector('[data-session-label]').textContent = `${labels[mode] || mode} session`;
  document.querySelector('[data-cfd-controls]').hidden = mode !== 'cfd';
  document.querySelector('[data-dynamics-controls]').hidden = mode !== 'dynamics';
}

function activateFallback(message) {
  fallback.hidden = false;
  canvas.hidden = true;
  fallback.querySelector('p').textContent = message;
  document.documentElement.dataset.quality = 'mobile';
  document.querySelector('[data-performance-label]').textContent = 'Static fallback';
  document.querySelector('[data-action="quality"]').textContent = 'LITE';
  document.querySelector('[data-fps]').textContent = 'Paused';
  document.querySelector('[data-fps-state]').textContent = 'Module loading unavailable';
  document.querySelector('[data-draw-calls]').textContent = '0';
  document.querySelector('[data-triangles]').textContent = '0';
  document.querySelector('[data-quality-tier]').textContent = 'Static';
  document.querySelector('[data-device-class]').textContent = 'Network-safe fallback';

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const { action, mode, workspaceTab, dock } = button.dataset;
    if (action === 'enter') openWorkspace('control');
    if (action === 'close-workspace') closeWorkspace();
    if (action === 'help') document.querySelector('[data-help-dialog]')?.showModal();
    if (action === 'quality') openWorkspace('diagnostics');
    if (action === 'reset-scene') syncMode('studio');
    if (workspaceTab) openWorkspace(workspaceTab);
    if (dock === 'vehicle') openWorkspace('control');
    if (dock === 'diagnostics') openWorkspace('diagnostics');
    if (dock === 'analysis') openWorkspace('analysis');
    if (mode) syncMode(mode);
  });

  window.RI60X = Object.freeze({
    version: '60.1.0-static',
    reset: () => {
      syncMode('studio');
      closeWorkspace();
    },
    diagnostics: () => ({ webgl: false, telemetry: false, bootstrapFallback: true })
  });
}

try {
  await import('./app.js');
} catch (error) {
  console.warn('RI-60X bootstrap failed; static fallback activated.', error);
  activateFallback('The 3D and telemetry modules could not be loaded. Navigation remains available in static mode.');
}
