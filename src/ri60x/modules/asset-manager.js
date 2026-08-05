export class AssetManager extends EventTarget {
  constructor() {
    super();
    this.assets = new Map();
    this.disposers = new Set();
    this.ready = false;
  }

  register(name, asset, disposer) {
    this.assets.set(name, asset);
    if (disposer) this.disposers.add(disposer);
    this.dispatchEvent(new CustomEvent('asset', { detail: { name, asset } }));
    return asset;
  }

  get(name) {
    return this.assets.get(name);
  }

  markReady() {
    this.ready = true;
    this.dispatchEvent(new CustomEvent('ready'));
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const url = registration.active?.scriptURL || '';
        if (url && !url.endsWith('/sw.js')) await registration.unregister();
      }
      await navigator.serviceWorker.register('./sw.js', { scope: './' });
    } catch (error) {
      this.dispatchEvent(new CustomEvent('warning', { detail: { message: 'Offline cache could not be initialized.', error } }));
    }
  }

  dispose() {
    for (const disposer of this.disposers) {
      try { disposer(); } catch { /* best-effort cleanup */ }
    }
    this.disposers.clear();
    this.assets.clear();
  }
}
