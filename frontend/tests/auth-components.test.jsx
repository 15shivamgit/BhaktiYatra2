import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';

const nav = { replace: vi.fn(), push: vi.fn() };
let searchParams = new URLSearchParams();
let pathname = '/account';

vi.mock('next/navigation', () => ({
  useRouter: () => nav,
  useSearchParams: () => searchParams,
  usePathname: () => pathname,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/api/endpoints', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    googleStartUrl: (next) => `http://api.test/auth/google${next ? `?next=${next}` : ''}`,
  },
}));

const { authApi } = await import('@/lib/api/endpoints');
const { UserContext } = await import('@/lib/auth/user-context');
const { default: LoginForm } = await import('@/components/auth/LoginForm');
const { default: RegisterForm } = await import('@/components/auth/RegisterForm');
const { default: RequireAuth } = await import('@/components/auth/RequireAuth');

function withUser(ui, value = {}) {
  const ctx = {
    user: null,
    status: 'guest',
    setUser: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    ...value,
  };
  return { ctx, ...render(<UserContext.Provider value={ctx}>{ui}</UserContext.Provider>) };
}

const sampleUser = { id: '1', name: 'Sunita', email: 's@example.com', role: 'user' };

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  pathname = '/account';
});

describe('LoginForm', () => {
  it('shows field errors without calling the API when the form is empty', async () => {
    withUser(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('logs in, stores the user and goes to the safe `next` path', async () => {
    searchParams = new URLSearchParams({ next: '/account' });
    authApi.login.mockResolvedValue(sampleUser);
    const { ctx } = withUser(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'S@Example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/account'));
    expect(authApi.login).toHaveBeenCalledWith({ email: 's@example.com', password: 'secret-pass' });
    expect(ctx.setUser).toHaveBeenCalledWith(sampleUser);
  });

  it('ignores an off-site `next` and sends admins to /admin', async () => {
    searchParams = new URLSearchParams({ next: 'https://evil.example' });
    authApi.login.mockResolvedValue({ ...sampleUser, role: 'admin' });
    withUser(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/admin'));
  });

  it('announces a wrong-password error', async () => {
    authApi.login.mockRejectedValue(
      new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }),
    );
    withUser(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 's@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('shows the Google error passed back on the URL, and a fallback for unknown codes', () => {
    searchParams = new URLSearchParams({ error: 'google_cancelled' });
    const { unmount } = withUser(<LoginForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('Google sign-in was cancelled.');
    unmount();

    searchParams = new URLSearchParams({ error: '<script>' });
    withUser(<LoginForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('We could not sign you in with Google');
  });

  it('links Google sign-in with the return path', () => {
    searchParams = new URLSearchParams({ next: '/account' });
    withUser(<LoginForm />);
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      'http://api.test/auth/google?next=/account',
    );
  });
});

describe('RegisterForm', () => {
  async function fill() {
    await userEvent.type(screen.getByLabelText('Full name'), 'Sunita Sharma');
    await userEvent.type(screen.getByLabelText('Email'), 'sunita@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Strong-Pass-1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Strong-Pass-1');
    await userEvent.click(screen.getByRole('checkbox'));
  }

  it('registers without sending an empty phone or the confirmation fields', async () => {
    authApi.register.mockResolvedValue(sampleUser);
    withUser(<RegisterForm />);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/'));
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Sunita Sharma',
      email: 'sunita@example.com',
      password: 'Strong-Pass-1',
    });
  });

  it('puts EMAIL_TAKEN on the email field with a log-in link', async () => {
    authApi.register.mockRejectedValue(
      new ApiError({ status: 409, code: 'EMAIL_TAKEN', message: 'x' }),
    );
    withUser(<RegisterForm />);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in instead' })).toBeInTheDocument();
  });

  it('shows server validation messages next to the right field', async () => {
    authApi.register.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [{ path: 'body.password', message: 'This password is too common' }],
      }),
    );
    withUser(<RegisterForm />);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('This password is too common')).toBeInTheDocument();
  });
});

describe('RequireAuth', () => {
  it('sends guests to login with a return path', async () => {
    pathname = '/account';
    withUser(<RequireAuth>secret</RequireAuth>, { status: 'guest' });
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/login?next=%2Faccount'));
  });

  it('shows a loading state while the session is checked', () => {
    withUser(<RequireAuth>secret</RequireAuth>, { status: 'loading' });
    expect(screen.getByRole('status', { name: 'Loading account' })).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('sends non-admins home from admin pages and lets admins in', async () => {
    const { unmount } = withUser(<RequireAuth role="admin">admin area</RequireAuth>, {
      status: 'authenticated',
      user: sampleUser,
    });
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('admin area')).not.toBeInTheDocument();
    unmount();

    withUser(<RequireAuth role="admin">admin area</RequireAuth>, {
      status: 'authenticated',
      user: { ...sampleUser, role: 'admin' },
    });
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});
