import { clamp } from './utils.js';

export class ChartRenderer {
  constructor(canvas, telemetry) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.telemetry = telemetry;
    this.compare = false;
    this.index = 0;
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(canvas);
  }

  setCompare(enabled) {
    this.compare = enabled;
    this.draw();
  }

  setIndex(index) {
    this.index = index;
    this.draw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  drawSeries(frames, key, color, width, height, min, max, alpha = 1, dash = []) {
    const ctx = this.context;
    const pad = { left: 8, right: 8, top: 10, bottom: 18 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.5;
    ctx.setLineDash(dash);
    ctx.beginPath();
    frames.forEach((frame, index) => {
      const value = typeof key === 'function' ? key(frame) : frame[key];
      const x = pad.left + (index / (frames.length - 1)) * chartWidth;
      const y = pad.top + (1 - clamp((value - min) / (max - min), 0, 1)) * chartHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    const { width, height } = this.resize();
    if (width < 2 || height < 2) return;
    const ctx = this.context;
    ctx.clearRect(0, 0, width, height);
    const styles = getComputedStyle(document.documentElement);
    const text = styles.getPropertyValue('--muted').trim() || '#9aa4b2';
    const line = styles.getPropertyValue('--line').trim() || 'rgba(255,255,255,.1)';
    const frames = this.telemetry.sample(Math.round(width));
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = 10 + (i / 4) * (height - 28);
      ctx.beginPath();
      ctx.moveTo(8, y);
      ctx.lineTo(width - 8, y);
      ctx.stroke();
    }
    ctx.fillStyle = text;
    ctx.font = '9px ui-sans-serif, system-ui';
    ctx.fillText('0:00', 8, height - 4);
    ctx.fillText('0:30', width - 34, height - 4);

    if (this.compare) this.drawSeries(this.telemetry.compareFrames.filter((_, i) => i % Math.max(1, Math.floor(this.telemetry.compareFrames.length / frames.length)) === 0).slice(0, frames.length), 'speed', '#89929e', width, height, 60, 340, .42, [4, 4]);
    this.drawSeries(frames, 'speed', '#f5f7fa', width, height, 60, 340, .94);
    this.drawSeries(frames, (frame) => frame.throttle * 320 + 60, '#61d398', width, height, 60, 380, .82);
    this.drawSeries(frames, (frame) => frame.brake * 320 + 60, '#ff6b73', width, height, 60, 380, .82);
    this.drawSeries(frames, (frame) => frame.tyreTemp.reduce((a, b) => a + b, 0) / 4 * 2.6, '#f0b45f', width, height, 60, 340, .76);

    const progress = this.index / (this.telemetry.frames.length - 1);
    const markerX = 8 + progress * (width - 16);
    ctx.strokeStyle = '#ff5038';
    ctx.globalAlpha = .8;
    ctx.beginPath();
    ctx.moveTo(markerX, 10);
    ctx.lineTo(markerX, height - 18);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  dispose() {
    this.resizeObserver.disconnect();
  }
}
