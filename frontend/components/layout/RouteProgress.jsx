'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const TRICKLE_MS = 300;
const SAFETY_TIMEOUT_MS = 15_000;

/** True for clicks that make the App Router load another page of this site. */
function isInternalNavigation(event, anchor) {
  if (!anchor || event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  // Same page with only a different hash: nothing loads.
  return !(url.pathname === window.location.pathname && url.search === window.location.search);
}

/**
 * Small controller for the bar element. It writes styles directly (no React state), so the
 * trickle animation never re-renders the page.
 */
function createProgress(root, bar) {
  let value = 0;
  let loading = false;
  let trickle = null;
  let hide = null;
  let safety = null;

  const paint = () => {
    bar.style.transform = `scaleX(${value})`;
  };
  const stopTimers = () => {
    clearInterval(trickle);
    clearTimeout(hide);
    clearTimeout(safety);
  };

  const api = {
    start() {
      stopTimers();
      loading = true;
      value = 0.08;
      root.dataset.state = 'loading';
      bar.style.opacity = '1';
      paint();
      // Quick at first, then slower; it never reaches the end until the page is ready.
      trickle = setInterval(() => {
        value = Math.min(0.92, value + (0.92 - value) * 0.12);
        paint();
      }, TRICKLE_MS);
      safety = setTimeout(api.done, SAFETY_TIMEOUT_MS);
    },
    done() {
      if (!loading) return;
      loading = false;
      stopTimers();
      value = 1;
      paint();
      hide = setTimeout(() => {
        bar.style.opacity = '0';
        root.dataset.state = 'idle';
        hide = setTimeout(() => {
          value = 0;
          paint();
        }, 300);
      }, 200);
    },
    dispose: stopTimers,
  };
  return api;
}

/**
 * Thin progress bar at the top of every page while a page loads: on the first visit until the
 * window has loaded, and on every internal navigation (link clicks, GET forms such as filters,
 * back/forward) until the new URL is shown. Visual only (aria-hidden); screen readers get the
 * Next.js route announcer.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const progress = useRef(null);

  useEffect(() => {
    const controller = createProgress(rootRef.current, barRef.current);
    progress.current = controller;

    // First visit: until the window has finished loading.
    const onLoad = () => controller.done();
    if (document.readyState !== 'complete') {
      controller.start();
      window.addEventListener('load', onLoad, { once: true });
    }

    const onClick = (event) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (isInternalNavigation(event, anchor)) controller.start();
    };
    // GET forms with an action navigate (next/form filters and search). Forms without an action
    // are handled by JavaScript (contact, booking) and do not load a page. Capture phase: next/form
    // calls preventDefault before navigating, so a bubbling listener would never see it.
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.getAttribute('action')) return;
      const method = (form.getAttribute('method') || 'get').toLowerCase();
      if (method === 'get') controller.start();
    };
    const onPopState = () => controller.start();

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('submit', onSubmit, { capture: true });
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('load', onLoad);
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('submit', onSubmit, { capture: true });
      window.removeEventListener('popstate', onPopState);
      controller.dispose();
    };
  }, []);

  // The new URL is on screen: finish.
  const url = `${pathname}?${searchParams.toString()}`;
  useEffect(() => {
    progress.current?.done();
  }, [url]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-testid="route-progress"
      data-state="idle"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-saffron via-primary to-accent shadow-[0_0_8px_rgba(217,115,31,0.6)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: 'scaleX(0)', opacity: 0 }}
      />
    </div>
  );
}
