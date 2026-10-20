import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ApiStatus.jsx imports the server fetch helper; the badge itself is pure, so stub the helper.
vi.mock('@/lib/api/server', () => ({ serverGet: vi.fn() }));

const { ApiStatusBadge } = await import('@/components/system/ApiStatus');
const { default: Container } = await import('@/components/layout/Container');
const { default: Footer } = await import('@/components/layout/Footer');

describe('ApiStatusBadge', () => {
  it.each([
    ['ok', 'API connected'],
    ['degraded', 'API running, database unreachable'],
    ['down', 'API unreachable'],
  ])('renders the %s state as an accessible status', (state, label) => {
    render(<ApiStatusBadge state={state} version={state === 'ok' ? '0.1.0' : undefined} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(label);
    expect(status).toHaveAttribute('data-state', state);
  });

  it('shows the version when provided', () => {
    render(<ApiStatusBadge state="ok" version="0.1.0" />);
    expect(screen.getByRole('status')).toHaveTextContent('Version 0.1.0');
  });
});

describe('Container', () => {
  it('renders the requested element with width classes', () => {
    render(
      <Container as="section" size="narrow" className="py-4">
        hello
      </Container>,
    );
    const el = screen.getByText('hello');
    expect(el.tagName).toBe('SECTION');
    expect(el.className).toContain('max-w-narrow');
    expect(el.className).toContain('py-4');
  });
});

describe('Footer', () => {
  it('shows business contact details with working links', () => {
    render(<Footer />);
    expect(screen.getByText(/Ramdiri-3, Begusarai/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+91 74888 81563' })).toHaveAttribute(
      'href',
      'tel:+917488881563',
    );
    expect(screen.getByRole('link', { name: '15shivambgs@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:15shivambgs@gmail.com',
    );
  });
});
