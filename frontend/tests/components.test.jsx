import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// next/image needs the Next.js runtime config; a plain <img> is enough for these tests.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ fill: _fill, priority: _priority, sizes: _sizes, ...props }) => <img {...props} />,
}));

const { default: Container } = await import('@/components/layout/Container');
const { default: Footer } = await import('@/components/layout/Footer');
const { default: TempleCard } = await import('@/components/temples/TempleCard');
const { default: Pagination } = await import('@/components/temples/Pagination');
const { TimingsTable, QuickFacts } = await import('@/components/temples/TempleSections');
const { default: cloudinaryLoader, ogImageUrl } = await import('@/lib/cloudinary-loader');
const { formatRange, formatTime, formatDistance, monthName } = await import('@/lib/format');

const temple = {
  id: '1',
  slug: 'kedarnath-temple-rudraprayag',
  name: 'Kedarnath Temple',
  deity: 'Shiva',
  city: 'Kedarnath',
  state: 'Uttarakhand',
  shortDescription: 'One of the twelve Jyotirlingas.',
  featured: true,
  primaryImage: {
    url: 'https://res.cloudinary.com/x/image/upload/kedar.jpg',
    alt: 'Stone temple facade',
  },
};

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
  it('shows business contact details and policy links', () => {
    render(<Footer />);
    expect(screen.getByText(/Ramdiri-3, Begusarai/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+91 74888 81563' })).toHaveAttribute(
      'href',
      'tel:+917488881563',
    );
    expect(screen.getByRole('link', { name: 'Cancellation and refund policy' })).toHaveAttribute(
      'href',
      '/refund-policy',
    );
  });
});

describe('TempleCard', () => {
  it('links to the temple and shows its image, place and featured badge', () => {
    render(<TempleCard temple={temple} />);
    expect(screen.getByRole('link', { name: 'Kedarnath Temple' })).toHaveAttribute(
      'href',
      '/temples/kedarnath-temple-rudraprayag',
    );
    expect(screen.getByRole('img', { name: 'Stone temple facade' })).toBeInTheDocument();
    expect(screen.getByText('Kedarnath, Uttarakhand')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('shows distance for nearby cards and a placeholder without an image', () => {
    render(
      <TempleCard temple={{ ...temple, featured: false, primaryImage: null, distanceKm: 12.4 }} />,
    );
    expect(screen.getByText('12 km away')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('keeps filters and drops page=1 from the first page link', () => {
    render(
      <Pagination
        page={2}
        totalPages={3}
        basePath="/temples"
        params={{ state: 'Gujarat', page: '2' }}
      />,
    );
    expect(screen.getByRole('link', { name: /Previous/ })).toHaveAttribute(
      'href',
      '/temples?state=Gujarat',
    );
    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute(
      'href',
      '/temples?state=Gujarat&page=3',
    );
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('renders nothing for a single page', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} basePath="/temples" params={{}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TimingsTable and QuickFacts', () => {
  it('formats timings and lists aarti times', () => {
    render(
      <TimingsTable
        timings={[
          { label: 'Morning darshan', open: '04:30', close: '13:00', note: 'Closed in winter' },
        ]}
        aarti={[{ name: 'Mangala aarti', time: '03:00' }]}
      />,
    );
    const row = screen.getByRole('row', { name: /Morning darshan/ });
    expect(within(row).getByText('4:30 am – 1:00 pm')).toBeInTheDocument();
    expect(within(row).getByText('Closed in winter')).toBeInTheDocument();
    expect(screen.getByText('3:00 am')).toBeInTheDocument();
    expect(screen.getByText(/confirm with the temple/)).toBeInTheDocument();
  });

  it('shows only the facts that exist', () => {
    render(<QuickFacts temple={{ timings: [], entryFee: 'Free', howToReach: null }} />);
    expect(screen.getByText('Entry fee')).toBeInTheDocument();
    expect(screen.queryByText('Nearest railway')).not.toBeInTheDocument();
  });
});

describe('formatting helpers and image loader', () => {
  it('formats times, ranges, distances and months', () => {
    expect(formatTime('00:15')).toBe('12:15 am');
    expect(formatTime('12:00')).toBe('12:00 pm');
    expect(formatRange('05:00', '21:30')).toBe('5:00 am – 9:30 pm');
    expect(formatDistance(0.6)).toBe('600 m');
    expect(monthName(11)).toBe('November');
  });

  it('adds Cloudinary transformations and leaves other hosts alone', () => {
    expect(
      cloudinaryLoader({
        src: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
        width: 384,
      }),
    ).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_384/v1/a.jpg');
    // Large photos use the lighter "eco" quality.
    expect(
      cloudinaryLoader({
        src: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
        width: 750,
      }),
    ).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:eco,c_limit,w_750/v1/a.jpg');
    expect(cloudinaryLoader({ src: 'https://lh3.googleusercontent.com/a/x', width: 64 })).toBe(
      'https://lh3.googleusercontent.com/a/x',
    );
    expect(ogImageUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toContain(
      'w_1200,h_630',
    );
  });
});
