/* HUICHENG — preloader dinámico solo al abrir o recargar.
   Los cambios entre páginas internas son inmediatos, sin animación de carga. */
(() => {
  'use strict';
  const key = 'huicheng:skip-preloader-next';

  // Marcamos la página de destino justo antes de seguir un enlace interno.
  // Solo el siguiente documento lo consume; una recarga posterior no lo conserva.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = event.target && event.target.closest && event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') ||
        (anchor.target && anchor.target.toLowerCase() !== '_self')) return;

    let destination;
    try { destination = new URL(anchor.href, location.href); }
    catch (_) { return; }
    const sameSite = destination.protocol === location.protocol && destination.host === location.host;
    const localPage = destination.pathname.startsWith(location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1));
    if (!sameSite || !localPage || !/\.html$/i.test(destination.pathname)) return;
    // Los enlaces #seccion no disparan una nueva página.
    if (destination.pathname === location.pathname && destination.search === location.search && destination.hash) return;

    try {
      sessionStorage.setItem(key, JSON.stringify({
        url: destination.pathname + destination.search,
        time: Date.now()
      }));
    } catch (_) {}

    // file:// puede aislar sessionStorage por archivo. Esta marca temporal
    // permite probar la web con doble clic en index.html, sin servidor local.
    if (location.protocol === 'file:') {
      destination.searchParams.set('hc-internal', '1');
      anchor.href = destination.href;
    }
  }, true);

  const html = document.documentElement;
  const overlay = document.getElementById('hc-preloader');
  if (!overlay || !html.classList.contains('hc-preload')) return;

  const progressBar = overlay.querySelector('.hc-preloader__fill');
  const progressValue = overlay.querySelector('.hc-preloader__number-value');
  const phase = overlay.querySelector('.hc-preloader__phase');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const started = performance.now();
  const minMs = reduceMotion ? 0 : 1130; // ~1.13 s de presentación + ~0.87 s de salida = 2 s
  let done = false;
  let ready = false;
  let exiting = false;
  let progress = 0;
  let frameId = null;

  function paint(value) {
    progress = Math.max(progress, Math.min(100, value));
    const rounded = Math.round(progress);
    if (progressBar) progressBar.style.width = rounded + '%';
    if (progressValue) progressValue.textContent = String(rounded).padStart(2, '0');
    if (phase) phase.textContent = rounded < 36 ? 'INICIANDO EXPERIENCIA' : rounded < 73 ? 'CONECTANDO MERCADOS' : rounded < 100 ? 'PREPARANDO EL SITIO' : 'BIENVENIDO A HUICHENG';
  }

  function animate(now) {
    if (done) return;
    const time = Math.min(1, (now - started) / 1080);
    const eased = 1 - Math.pow(1 - time, 2.1);
    paint(94 * eased);
    frameId = requestAnimationFrame(animate);
  }

  function removeLoader() {
    html.classList.remove('hc-preload');
    if (overlay.parentNode) overlay.remove();
  }

  function exit() {
    if (exiting) return;
    exiting = true;
    done = true;
    if (frameId) cancelAnimationFrame(frameId);
    paint(100);
    window.setTimeout(() => {
      overlay.classList.add('hc-preloader--exit');
      window.setTimeout(removeLoader, reduceMotion ? 0 : 870);
    }, reduceMotion ? 0 : 20);
  }

  function onReady() {
    if (ready) return;
    ready = true;
    window.setTimeout(exit, Math.max(0, minMs - (performance.now() - started)));
  }

  if (reduceMotion) onReady();
  else {
    frameId = requestAnimationFrame(animate);
    // El documento HTML ya está listo con defer; no esperamos imágenes externas.
    // Así no retenemos al visitante durante varios segundos si alguna imagen tarda.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady, { once: true });
    else onReady();
    window.setTimeout(onReady, 1400);
  }
})();
