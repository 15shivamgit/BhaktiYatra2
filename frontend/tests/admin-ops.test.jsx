import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuditDiff } from '@/components/admin/AdminAuditPage';
import { ConfirmActionForm, fieldErrors } from '@/components/admin/dialog-form';
import { formatDateTime, humanize } from '@/lib/admin/format';
import { apiQuery } from '@/lib/admin/use-url-query';

describe('admin list helpers', () => {
  it('builds API query strings without empty filters', () => {
    expect(apiQuery({ q: 'BY-1', bookingStatus: '', page: 2, from: undefined, to: null })).toBe(
      'q=BY-1&page=2',
    );
    expect(apiQuery({ q: 'a b&c' })).toBe('q=a+b%26c');
  });

  it('formats times in India and humanises codes', () => {
    expect(formatDateTime('2026-10-21T08:35:00Z')).toMatch(/21 Oct 2026, 2:05\s?pm/i);
    expect(formatDateTime(null)).toBe('');
    expect(humanize('payment_received_no_seats')).toBe('payment received no seats');
  });
});

describe('dialog form errors', () => {
  it('maps API details to fields, nested paths included', () => {
    const error = {
      code: 'VALIDATION_ERROR',
      details: [
        { path: 'body.refund.amount', message: 'Too much' },
        { path: 'body.reason', message: 'Give a reason' },
      ],
    };
    expect(fieldErrors(error)).toEqual({
      'refund.amount': 'Too much',
      refund: 'Too much',
      reason: 'Give a reason',
    });
  });

  it('also reads REASON_REQUIRED and ignores errors without field details', () => {
    expect(
      fieldErrors({
        code: 'REASON_REQUIRED',
        details: [{ path: 'body.reason', message: 'Give a reason for this change' }],
      }),
    ).toEqual({ reason: 'Give a reason for this change' });
    expect(fieldErrors({ code: 'SEATS_UNAVAILABLE', details: { seatsAvailable: 0 } })).toEqual({});
    expect(fieldErrors(null)).toEqual({});
  });

  it('a confirm form shows the server explanation when the request fails', async () => {
    const request = vi.fn().mockRejectedValue({
      code: 'SEATS_UNAVAILABLE',
      message: 'Only 1 seat(s) are free; raise the departure’s total seats first',
    });
    render(
      <ConfirmActionForm
        message="Sure?"
        confirmLabel="Confirm"
        request={request}
        onDone={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Only 1 seat(s) are free');
  });
});

describe('audit diff', () => {
  it('shows every field and marks the changed ones', () => {
    render(
      <AuditDiff
        before={{ bookingStatus: 'confirmed', seats: 2 }}
        after={{ bookingStatus: 'cancelled', seats: 2, refund: { amount: 500 } }}
      />,
    );
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    const status = within(rows[0]);
    expect(status.getByRole('rowheader')).toHaveTextContent('bookingStatus (changed)');
    expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent(/^seats$/);
    expect(rows[2]).toHaveTextContent('{"amount":500}');
  });

  it('says when nothing was recorded', () => {
    render(<AuditDiff before={null} after={null} />);
    expect(screen.getByText('No field changes were recorded for this action.')).toBeInTheDocument();
  });
});
