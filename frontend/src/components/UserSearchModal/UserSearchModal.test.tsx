import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NameEntry } from '../../hooks';
import { testContexts } from '../../test/fixtures';
import { mockShowModal, mockAudioApi } from '../../test/mocks';
import { UserSearchModal } from './UserSearchModal';

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

vi.mock('../../hooks', async () => {
  const actual =
    await vi.importActual<typeof import('../../hooks')>('../../hooks');
  return {
    ...actual,
    useNames: () => ({
      fetchUserNamesById,
    }),
  };
});

describe('UserSearchModal', () => {
  beforeEach(() => {
    // Reset mock
    fetchUserNamesById.mockReset();

    // Mock the showModal method for dialogs
    mockShowModal();
    mockAudioApi();
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
  });

  it('shows the user id in the title', async () => {
    fetchUserNamesById.mockResolvedValue([]);

    render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        userId="user-1"
        contexts={testContexts}
      />,
    );

    expect(screen.getByText(/Find user/)).toBeInTheDocument();
    expect(screen.getByText(/user-1/)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchUserNamesById).toHaveBeenCalledWith('user-1'),
    );
  });

  it('shows loading skeletons while fetching', () => {
    fetchUserNamesById.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <UserSearchModal
        open
        onClose={vi.fn()}
        userId="user-1"
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
        userId="user-1"
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
        userId="user-1"
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
        userId="user-1"
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
        userId="user-1"
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
