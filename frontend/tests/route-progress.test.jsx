import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nav = { pathname: '/', search: '' };
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const { default: RouteProgress } = await import('@/components/layout/RouteProgress');

function Page() {
  return (
    <>
      <RouteProgress />
      {/* A plain anchor on purpose: the bar must react to any same-site link. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/temples">Temples</a>
      <a href="#main">Skip</a>
      <a href="https://example.com/">Elsewhere</a>
      <a href="/tours" target="_blank" rel="noreferrer">
        New tab
      </a>
      <form method="get" action="/tours" onSubmit={(e) => e.preventDefault()}>
        <button type="submit">Filter</button>
      </form>
      <form onSubmit={(e) => e.preventDefault()}>
        <button type="submit">Send message</button>
      </form>
    </>
  );
}

const state = () => screen.getByTestId('route-progress').dataset.state;
// jsdom has no navigation: stop the browser from trying after our listener has run.
const click = (name) => fireEvent.click(screen.getByRole('link', { name }), { button: 0 });

describe('RouteProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    nav.pathname = '/';
    nav.search = '';
    document.addEventListener('click', preventNavigation);
  });
  afterEach(() => {
    document.removeEventListener('click', preventNavigation);
    vi.useRealTimers();
  });
  function preventNavigation(event) {
    if (event.target.closest?.('a')) event.preventDefault();
  }

  it('starts on an internal link and finishes when the new URL is shown', () => {
    const { rerender } = render(<Page />);
    expect(state()).toBe('idle');
    click('Temples');
    expect(state()).toBe('loading');

    nav.pathname = '/temples';
    rerender(<Page />);
    act(() => vi.advanceTimersByTime(600));
    expect(state()).toBe('idle');
  });

  it('ignores hash links, other sites and new tabs', () => {
    render(<Page />);
    click('Skip');
    click('Elsewhere');
    click('New tab');
    expect(state()).toBe('idle');
  });

  it('starts on a GET form submission (filters) and on back/forward', () => {
    const { rerender } = render(<Page />);
    fireEvent.submit(screen.getByRole('button', { name: 'Filter' }).closest('form'));
    expect(state()).toBe('loading');
    nav.search = 'days=1-3';
    rerender(<Page />);
    act(() => vi.advanceTimersByTime(600));
    expect(state()).toBe('idle');

    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(state()).toBe('loading');
  });

  it('ignores forms handled by JavaScript (no action)', () => {
    render(<Page />);
    fireEvent.submit(screen.getByRole('button', { name: 'Send message' }).closest('form'));
    expect(state()).toBe('idle');
  });

  it('never stays visible forever', () => {
    render(<Page />);
    click('Temples');
    act(() => vi.advanceTimersByTime(16_000));
    expect(state()).toBe('idle');
  });
});
