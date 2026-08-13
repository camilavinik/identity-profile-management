import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  testContexts,
  testHistoryEntry,
  testHistoryPage,
} from '../../test/fixtures';
import { mockAudioApi } from '../../test/mocks';
import { NameHistory } from './NameHistory';

describe('NameHistory', () => {
  beforeEach(() => {
    // Mock the Audio API
    mockAudioApi();
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
  });

  it('shows the history title', () => {
    render(
      <NameHistory
        history={testHistoryPage}
        contexts={testContexts}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('shows loading skeletons while loading', () => {
    const { container } = render(
      <NameHistory
        history={null}
        contexts={testContexts}
        loading
        error={null}
      />,
    );

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('shows an error alert when there is an error', () => {
    render(
      <NameHistory
        history={null}
        contexts={testContexts}
        loading={false}
        error="Failed to load"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load');
  });

  it('shows an empty state when there is no history', () => {
    render(
      <NameHistory
        history={{ ...testHistoryPage, data: [] }}
        contexts={testContexts}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No previous names yet',
    );
  });

  it('shows history entries with context, charset and value', () => {
    render(
      <NameHistory
        history={testHistoryPage}
        contexts={testContexts}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText('LATIN')).toBeInTheDocument();
    expect(screen.getByText('Old Name')).toBeInTheDocument();
  });

  it('shows a placeholder when an entry has no value', () => {
    render(
      <NameHistory
        history={{
          ...testHistoryPage,
          data: [{ ...testHistoryEntry, value: null }],
        }}
        contexts={testContexts}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText('No value')).toBeInTheDocument();
  });

  it('shows a filtered empty state when no entries match', async () => {
    const user = userEvent.setup();
    render(
      <NameHistory
        history={testHistoryPage}
        contexts={testContexts}
        loading={false}
        error={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'RELIGIOUS' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No names match the selected filters',
    );
  });
});
