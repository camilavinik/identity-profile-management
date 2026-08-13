import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from './layout';

function renderLayout(initialPath = '/login') {
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: (
          <Layout
            title="Welcome back"
            cta="Sign in"
            onSubmit={vi.fn()}
            disabledSubmit={false}
          >
            <div>Login fields</div>
          </Layout>
        ),
      },
      {
        path: '/signup',
        element: (
          <Layout
            title="Create an account"
            cta="Create an account"
            onSubmit={vi.fn()}
            disabledSubmit={false}
          >
            <div>Signup fields</div>
          </Layout>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('navigates to signup when the Sign up tab is selected', async () => {
    const user = userEvent.setup();
    const router = renderLayout('/login');

    await user.click(screen.getByRole('tab', { name: 'Sign up' }));

    expect(router.state.location.pathname).toBe('/signup');
  });

  it('navigates to login when the Sign in tab is selected', async () => {
    const user = userEvent.setup();
    const router = renderLayout('/signup');

    await user.click(screen.getByRole('tab', { name: 'Sign in' }));

    expect(router.state.location.pathname).toBe('/login');
  });

  it('shows the back to login link when enabled', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/forgot-password',
          element: (
            <Layout
              title="Forgot password"
              cta="Send reset link"
              onSubmit={vi.fn()}
              disabledSubmit={false}
              showApiDocs={false}
              showAuthTabs={false}
              showBackToLogin
            >
              <div>Forgot fields</div>
            </Layout>
          ),
        },
        { path: '/login', element: <div>Login page</div> },
      ],
      { initialEntries: ['/forgot-password'] },
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('link', { name: /Back to login/i }),
    ).toHaveAttribute('href', '/login');
  });
});
