/* HUICHENG / Transición de navegación sin pantalla de carga.
   Se aplica a Inicio, Nosotros, Servicios, Marcas, Global y Contacto. */
(() => {
  'use strict';
  const html = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accent = document.createElement('div');
  accent.className = 'hc-nav-accent';
  accent.setAttribute('aria-hidden', 'true');
  document.body.appendChild(accent);

  // Restaurar la página si se vuelve con el botón Atrás (bfcache).
  addEventListener('pageshow', () => {
    html.classList.remove('hc-nav-leaving');
  });

  if (html.classList.contains('hc-nav-arrival')) {
    window.setTimeout(() => html.classList.remove('hc-nav-arrival'), reduced ? 0 : 650);
  }

  let navigating = false;
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
        event.metaKey || event.altKey || event.shiftKey || navigating) return;

    const a = event.target?.closest?.('.header .nav a[href], .header .brand[href], .header .header-cta[href]');
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;

    let dest;
    try { dest = new URL(a.href, location.href); } catch (_) { return; }
    const directory = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
    if (dest.origin !== location.origin ||
        !dest.pathname.startsWith(directory) ||
        !/\.html$/i.test(dest.pathname)) return;
    if (dest.pathname === location.pathname && dest.search === location.search && dest.hash) return;
    if (reduced) return; // Respeta la preferencia de accesibilidad y navega normalmente.

    event.preventDefault();
    navigating = true;
    html.classList.add('hc-nav-leaving');

    // El script de carga ha marcado previamente este enlace como navegación
    // interna; la siguiente página omitirá la pantalla de carga completa.
    if (innerWidth > 820 && a.closest('.nav')) {
      const nav = a.closest('.nav');
      const old = nav.querySelector('[aria-current="page"], .nav-active') || a;
      const from = old.getBoundingClientRect();
      const to = a.getBoundingClientRect();
      const area = nav.getBoundingClientRect();
      const tracer = document.createElement('span');
      tracer.className = 'hc-nav-tracer';
      tracer.setAttribute('aria-hidden', 'true');
      tracer.style.left = (from.left - area.left) + 'px';
      tracer.style.width = from.width + 'px';
      nav.appendChild(tracer);
      a.classList.add('hc-nav-target');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        tracer.style.left = (to.left - area.left) + 'px';
        tracer.style.width = to.width + 'px';
      }));
    }

    const targetHref = a.href; // Respeta el marcador hc-internal usado bajo file://.
    window.setTimeout(() => { location.assign(targetHref); }, 335);
  });
})();
