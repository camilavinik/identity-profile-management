import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testContexts, testName } from '../../test/fixtures';
import {
  authMockState,
  mockAudioApi,
  mockShowModal,
  resetAuthMock,
} from '../../test/mocks';
import { MyNames } from './MyNames';

const names = [testName];

const createName = vi.fn();
const updateName = vi.fn();

vi.mock('../../auth', () => ({
  useAuth: () => authMockState,
}));

vi.mock('../../hooks', async () => {
  const actual =
    await vi.importActual<typeof import('../../hooks')>('../../hooks');
  return {
    ...actual,
    useNames: () => ({
      createName,
      updateName,
    }),
  };
});

describe('MyNames', () => {
  beforeEach(() => {
    // Mock the createName and updateName functions
    createName.mockReset().mockResolvedValue(undefined);
    updateName.mockReset().mockResolvedValue(undefined);

    // Reset the shared auth mock state
    resetAuthMock();

    // Mock the showModal method for dialogs
    mockShowModal();
    mockAudioApi();
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
  });

  it('shows the section title and add button', () => {
    render(
      <MyNames
        names={names}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    expect(screen.getByText('My names')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Name/i }),
    ).toBeInTheDocument();
  });

  it('shows loading skeletons while loading', () => {
    const { container } = render(
      <MyNames
        names={[]}
        contexts={testContexts}
        loading
        error={null}
        refresh={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('shows an error alert when there is an error', () => {
    render(
      <MyNames
        names={[]}
        contexts={testContexts}
        loading={false}
        error="Could not load names"
        refresh={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load names');
  });

  it('shows an empty state when there are no names', () => {
    render(
      <MyNames
        names={[]}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No names added yet');
  });

  it('shows name cards', () => {
    render(
      <MyNames
        names={names}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('LATIN')).toBeInTheDocument();
  });

  it('shows a filtered empty state when no names match the selected filters', async () => {
    const user = userEvent.setup();
    render(
      <MyNames
        names={names}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'RELIGIOUS' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No names match the selected filters',
    );
  });

  it('opens the add name modal', async () => {
    const user = userEvent.setup();
    render(
      <MyNames
        names={names}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Add Name/i }));

    expect(screen.getByText('Add name')).toBeInTheDocument();
  });

  it('creates a name and refreshes', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();

    render(
      <MyNames
        names={[]}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={refresh}
      />,
    );

    // Click the add name button and select the context and type in the charset
    await user.click(screen.getByRole('button', { name: /Add Name/i }));
    await user.selectOptions(screen.getByRole('combobox'), 'legal');
    await user.type(
      screen.getByPlaceholderText('latin, hebrew, arabic…'),
      'latin',
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(createName).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'legal',
        charset: 'latin',
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it('opens the edit modal and saves changes', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();

    render(
      <MyNames
        names={names}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={refresh}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit name')).toBeInTheDocument();

    // Clear the value and type in the new value
    const [, valueInput] = screen.getAllByRole('textbox');
    await user.clear(valueInput);
    await user.type(valueInput, 'Test name value');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateName).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        context: 'legal',
        charset: 'latin',
        value: 'Test name value',
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it('pre-fills an empty value when editing a name without one', async () => {
    const user = userEvent.setup();
    render(
      <MyNames
        names={[{ ...testName, value: null }]}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const [, valueInput] = screen.getAllByRole('textbox');
    expect(valueInput).toHaveValue('');
  });

  it('leaves context empty when the name context is unknown', async () => {
    const user = userEvent.setup();
    render(
      <MyNames
        names={[
          {
            ...testName,
            context: { name: 'Unknown', description: null },
          },
        ]}
        contexts={testContexts}
        loading={false}
        error={null}
        refresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('combobox')).toHaveValue('');
  });
});
