import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NameEntry } from '../../hooks';
import { testContexts } from '../../test/fixtures';
import { mockShowModal, mockAudioApi } from '../../test/mocks';
import { UserSearchModal } from './UserSearchModal';

const TEST_UUID = '11111111-1111-1111-1111-111111111111';

const names: NameEntry[] = [
  {
    id: '1',
    value: 'test',
    charset: 'testcharset',
    audio_key: null,
    audio_url: null,
    context: { name: 'Test Context', description: null },
  },
];

const fetchUserNamesById = vi.fn();
const fetchUserNamesByEmail = vi.fn();

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

describe('UserSearchModal', () => {
  beforeEach(() => {
    // Reset mock
    fetchUserNamesById.mockReset();
    fetchUserNamesByEmail.mockReset();

    // Mock the showModal method for dialogs
    mockShowModal();
    mockAudioApi();
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
  });

  it('shows the searched value in the title', async () => {
    fetchUserNamesById.mockResolvedValue([]);

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched={TEST_UUID}
        contexts={testContexts}
      />,
    );

    expect(screen.getByText(/Find user/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TEST_UUID))).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchUserNamesById).toHaveBeenCalledWith(TEST_UUID),
    );
  });

  it('fetches names by email when searched is an email', async () => {
    fetchUserNamesByEmail.mockResolvedValue([]);

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched="user@test.com"
        contexts={testContexts}
      />,
    );

    expect(screen.getByText(/user@test.com/)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchUserNamesByEmail).toHaveBeenCalledWith('user@test.com'),
    );
    expect(fetchUserNamesById).not.toHaveBeenCalled();
  });

  it('shows a validation error without fetching when searched is invalid', () => {
    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched="not-a-uuid-or-email"
        contexts={testContexts}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid user id (UUID) or email address',
    );
    expect(fetchUserNamesById).not.toHaveBeenCalled();
    expect(fetchUserNamesByEmail).not.toHaveBeenCalled();
  });

  it('shows loading skeletons while fetching', () => {
    fetchUserNamesById.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched={TEST_UUID}
        contexts={testContexts}
      />,
    );

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('shows an error when the fetch fails', async () => {
    fetchUserNamesById.mockRejectedValue(new Error('User not found'));

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched={TEST_UUID}
        contexts={testContexts}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'User not found',
    );
  });

  it('shows an empty state when the user has no names', async () => {
    fetchUserNamesById.mockResolvedValue([]);

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched={TEST_UUID}
        contexts={testContexts}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This user has no names yet',
    );
  });

  it('shows the fetched names', async () => {
    fetchUserNamesById.mockResolvedValue(names);

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched={TEST_UUID}
        contexts={testContexts}
      />,
    );

    expect(await screen.findByText('test')).toBeInTheDocument();
    expect(screen.getByText('TESTCHARSET')).toBeInTheDocument();
  });

  it('shows a filtered empty state when no names match', async () => {
    const user = userEvent.setup();
    fetchUserNamesById.mockResolvedValue(names);

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        searched={TEST_UUID}
        contexts={testContexts}
      />,
    );

    await screen.findByText('test');
    await user.click(screen.getByRole('button', { name: 'RELIGIOUS' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No names match the selected filters',
    );
  });
});
