import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Tabs, { tabPanelProps } from '@/components/admin/Tabs';
import {
  adminErrorMessage,
  applyApiErrors,
  errorCountsByTab,
  formFieldFor,
} from '@/lib/admin/errors';
import { emptyTempleValues, FIELD_TABS, toFormValues, toPayload } from '@/lib/admin/temple-form';

const apiTemple = {
  name: 'Kedarnath Temple',
  slug: 'kedarnath-temple-rudraprayag',
  deity: 'Shiva',
  religion: 'hindu',
  state: 'Uttarakhand',
  city: 'Kedarnath',
  shortDescription: 'One of the twelve Jyotirlingas.',
  description: '<p>Long text</p>',
  timings: [{ label: 'Morning darshan', open: '06:00', close: '15:00' }],
  festivals: [{ name: 'Maha Shivaratri', month: 2 }],
  rules: ['No leather', 'No photos inside'],
  tags: ['jyotirlinga', 'char dham'],
  location: { lat: 30.7352, lng: 79.0669 },
  seo: { title: 'Kedarnath' },
  howToReach: { nearestAirport: 'Jolly Grant Airport' },
};

describe('temple form mapping', () => {
  it('turns API data into string form values and back without loss', () => {
    const values = toFormValues(apiTemple);
    expect(values.lat).toBe('30.7352');
    expect(values.rulesText).toBe('No leather\nNo photos inside');
    expect(values.festivals[0]).toEqual({ name: 'Maha Shivaratri', month: '2', description: '' });
    expect(values.howToReach.nearestRailway).toBe('');

    const payload = toPayload(values, { mode: 'update', originalSlug: apiTemple.slug });
    expect(payload.slug).toBeUndefined(); // unchanged slugs are not sent
    expect(payload.location).toEqual({ lat: 30.7352, lng: 79.0669 });
    expect(payload.rules).toEqual(['No leather', 'No photos inside']);
    expect(payload.tags).toEqual(['jyotirlinga', 'char dham']);
    expect(payload.timings).toEqual([
      { label: 'Morning darshan', open: '06:00', close: '15:00', note: undefined },
    ]);
    expect(payload.festivals[0]).toEqual({
      name: 'Maha Shivaratri',
      month: 2,
      description: undefined,
    });
  });

  it('sends a changed slug, clears the location, and drops blank rows', () => {
    const values = {
      ...toFormValues(apiTemple),
      slug: 'kedarnath',
      lat: '',
      lng: '',
      timings: [{ label: '  ', open: '', close: '', note: '' }],
    };
    const payload = toPayload(values, { mode: 'update', originalSlug: apiTemple.slug });
    expect(payload.slug).toBe('kedarnath');
    expect(payload.location).toBeNull();
    expect(payload.timings).toEqual([]);
  });

  it('create payload holds only the draft fields', () => {
    const payload = toPayload(
      { ...emptyTempleValues(), name: ' Test ', deity: 'Shiva', state: 'Bihar', city: 'Gaya' },
      { mode: 'create' },
    );
    expect(Object.keys(payload).sort()).toEqual(
      [
        'city',
        'deity',
        'description',
        'featured',
        'name',
        'religion',
        'shortDescription',
        'state',
      ].sort(),
    );
    expect(payload.name).toBe('Test');
  });
});

describe('admin error helpers', () => {
  it('maps API paths to form fields', () => {
    expect(formFieldFor('body.location.lat')).toBe('lat');
    expect(formFieldFor('body.rules.3')).toBe('rulesText');
    expect(formFieldFor('body.tags.0')).toBe('tagsText');
    expect(formFieldFor('body.timings.0.open')).toBe('timings.0.open');
  });

  it('applies known field errors and returns the rest', () => {
    const setError = vi.fn();
    const unmatched = applyApiErrors(
      setError,
      [
        { path: 'body.timings.0.open', message: 'Use 24-hour time' },
        { path: 'body', message: 'Provide at least one field' },
      ],
      Object.keys(emptyTempleValues()),
    );
    expect(setError).toHaveBeenCalledWith(
      'timings.0.open',
      { type: 'server', message: 'Use 24-hour time' },
      { shouldFocus: true },
    );
    expect(unmatched).toEqual([{ path: 'body', message: 'Provide at least one field' }]);
  });

  it('counts nested errors per tab', () => {
    const errors = {
      name: { type: 'required', message: 'Name is required' },
      timings: [
        undefined,
        { open: { type: 'server', message: 'x' }, label: { type: 'required', message: 'y' } },
      ],
      lat: { type: 'validate', message: 'z' },
    };
    expect(errorCountsByTab(errors, FIELD_TABS)).toEqual({ basics: 1, timings: 2, location: 1 });
  });

  it('shows server explanations for content rules', () => {
    expect(
      adminErrorMessage({ code: 'HAS_REFERENCES', message: 'This temple is part of a circuit' }),
    ).toBe('This temple is part of a circuit');
    expect(adminErrorMessage({ code: 'NETWORK_ERROR' })).toMatch(/could not reach/i);
  });
});

function TabsHarness() {
  const [active, setActive] = useState('a');
  const tabs = [
    { key: 'a', label: 'Basics' },
    { key: 'b', label: 'Content', errors: 2 },
    { key: 'c', label: 'SEO' },
  ];
  return (
    <>
      <Tabs tabs={tabs} active={active} onChange={setActive} label="Sections" idPrefix="t" />
      {tabs.map((tab) => (
        <div key={tab.key} {...tabPanelProps('t', tab.key, active)}>
          Panel {tab.label}
        </div>
      ))}
    </>
  );
}

describe('Tabs', () => {
  it('follows the ARIA tabs pattern with arrow keys and error counts', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);
    expect(screen.getByRole('tab', { name: 'Basics' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Content (2 errors)' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Basics');

    await user.click(screen.getByRole('tab', { name: 'Basics' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Content/ })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Content');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'SEO' })).toHaveAttribute('aria-selected', 'true');
  });
});
