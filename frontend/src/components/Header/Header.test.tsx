import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_DOCS_URL } from '../../lib/apiDocs';
import { testContexts } from '../../test/fixtures';
import { mockShowModal, mockAudioApi } from '../../test/mocks';
import { Header } from './Header';

const logout = vi.fn();
const setHowItWorksOpen = vi.fn();
const fetchUserNamesById = vi.fn();
const fetchUserNamesByEmail = vi.fn();
let howItWorksOpen = false;

vi.mock('../../auth', () => ({
  useAuth: () => ({
    logout,
    email: 'test@email.com',
    get howItWorksOpen() {
      return howItWorksOpen;
    },
    setHowItWorksOpen,
  }),
}));

vi.mock('../../hooks', async () => {
  const actual =
    await vi.importActual<typeof import('../../hooks')>('../../hooks');
  return {
    ...actual,
    useNames: () => ({
      fetchUserNamesById,
      fetchUserNamesByEmail,
    }),
  };
});

function renderHeader(initialPath = '/') {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Header contexts={testContexts} /> },
      { path: '/:userId', element: <Header contexts={testContexts} /> },
    ],
    { initialEntries: [initialPath] },
  );

  const view = render(<RouterProvider router={router} />);
  return { ...view, router };
}

const TEST_UUID = '11111111-1111-1111-1111-111111111111';

describe('Header', () => {
  beforeEach(() => {
    // Reset mocks
    logout.mockReset();
    setHowItWorksOpen.mockReset();
    fetchUserNamesById.mockReset().mockResolvedValue([]);
    fetchUserNamesByEmail.mockReset().mockResolvedValue([]);
    howItWorksOpen = false;

    // Reset theme state
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    // Mock the showModal method for dialogs
    mockShowModal();

    // Mock the Audio API
    mockAudioApi();
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
  });

  it('shows the project name and user email', () => {
    renderHeader();

    expect(screen.getByText('IPM')).toBeInTheDocument();
    expect(screen.getByText('Identity Profile Management')).toBeInTheDocument();
    expect(screen.getByText('test@email.com')).toBeInTheDocument();
  });

  it('keeps the full title available for larger screens', () => {
    renderHeader();

    expect(screen.getByText('Identity Profile Management')).toHaveClass(
      'hidden',
      'sm:inline',
    );
  });

  it('disables search when the input is empty', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('navigates to the user id on search', async () => {
    const user = userEvent.setup();
    const { router } = renderHeader();

    await user.type(
      screen.getByPlaceholderText('Find user by id or email'),
      TEST_UUID,
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(router.state.location.pathname).toBe(`/${TEST_UUID}`);
    expect(await screen.findByText(/Find user/)).toBeInTheDocument();
    expect(fetchUserNamesById).toHaveBeenCalledWith(TEST_UUID);
  });

  it('searches by email when the query is an email', async () => {
    const user = userEvent.setup();
    const { router } = renderHeader();

    await user.type(
      screen.getByPlaceholderText('Find user by id or email'),
      'user@test.com',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(router.state.location.pathname).toBe(
      `/${encodeURIComponent('user@test.com')}`,
    );
    expect(await screen.findByText(/Find user/)).toBeInTheDocument();
    expect(screen.getByText(/user@test.com/)).toBeInTheDocument();
    expect(fetchUserNamesByEmail).toHaveBeenCalledWith('user@test.com');
    expect(fetchUserNamesById).not.toHaveBeenCalled();
  });

  it('does not navigate when search is whitespace string', async () => {
    const user = userEvent.setup();
    const { router } = renderHeader();

    const input = screen.getByPlaceholderText('Find user by id or email');
    await user.type(input, '   ');
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();

    // Submit the form directly even though the button is disabled
    fireEvent.submit(input.closest('form')!);

    expect(router.state.location.pathname).toBe('/');
  });

  it('links to the API documentation', () => {
    renderHeader();

    expect(
      screen.getByRole('link', { name: /API Documentation/i }),
    ).toHaveAttribute('href', API_DOCS_URL);
  });

  it('opens How it works from the options menu', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: /How it works/i }));
    expect(setHowItWorksOpen).toHaveBeenCalledWith(true);
  });

  it('Got it button closes the How it works modal', async () => {
    const user = userEvent.setup();
    howItWorksOpen = true;
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(setHowItWorksOpen).toHaveBeenCalledWith(false);
  });

  it('logs out when Log Out is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: /Log Out/i }));
    expect(logout).toHaveBeenCalled();
  });

  it('opens the user search modal when a user id is in the url', async () => {
    renderHeader(`/${TEST_UUID}`);

    expect(await screen.findByText(/Find user/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TEST_UUID))).toBeInTheDocument();
  });

  it('toggles between light and dark mode when theme button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: /switch to light mode/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /switch to light mode/i }),
    );
    expect(
      screen.getByRole('button', { name: /switch to dark mode/i }),
    ).toBeInTheDocument();
  });

  it('navigates home when the user search modal closes', async () => {
    const { router } = renderHeader(`/${TEST_UUID}`);

    expect(await screen.findByText(/Find user/)).toBeInTheDocument();

    screen
      .getByRole('dialog', { hidden: true })
      .dispatchEvent(new Event('close', { bubbles: true }));

    expect(router.state.location.pathname).toBe('/');
    await waitFor(() => {
      expect(screen.queryByText(/Find user/)).not.toBeInTheDocument();
    });
  });
});
