import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NameEntry } from '../../hooks';
import { mockAudioApi } from '../../test/mocks';
import { NameCard } from './NameCard';

const name: NameEntry = {
  id: '1',
  value: 'Test Name',
  charset: 'test charset',
  audio_key: null,
  audio_url: null,
  context: { name: 'Test Context', description: 'Test description' },
};

describe('NameCard', () => {
  beforeEach(() => {
    // Mock the audio API
    mockAudioApi();
  });

  afterEach(() => {
    // Reset the audio API mock
    vi.unstubAllGlobals();
  });

  it('shows context, charset and name', () => {
    render(<NameCard name={name} />);

    expect(screen.getByText('TEST CONTEXT')).toBeInTheDocument();
    expect(screen.getByText('TEST CHARSET')).toBeInTheDocument();
    expect(screen.getByText('Test Name')).toBeInTheDocument();
  });

  it('shows a placeholder when there is no value', () => {
    render(<NameCard name={{ ...name, value: null }} />);
    expect(screen.getByText('No value')).toBeInTheDocument();
  });

  it('renders a loading skeleton when skeleton is true', () => {
    const { container } = render(<NameCard name={name} skeleton />);
    expect(container.querySelector('.skeleton')).toHaveClass('h-26');
  });

  it('renders a shorter skeleton for size sm', () => {
    const { container } = render(<NameCard name={name} skeleton size="sm" />);
    expect(container.querySelector('.skeleton')).toHaveClass('h-20');
  });

  it('shows the edit options and calls onEdit when clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<NameCard name={name} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('shows delete option and calls onDelete when clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<NameCard name={name} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('does not show edit options without onEdit', () => {
    render(<NameCard name={name} />);
    expect(
      screen.queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();
  });

  it('adds a border to the card when border is true', () => {
    const { container } = render(<NameCard name={name} border />);
    expect(container.querySelector('.card')).toHaveClass(
      'border',
      'border-base-300',
    );
  });

  it('uses smaller text for size sm', () => {
    render(<NameCard name={name} size="sm" />);
    expect(screen.getByText('Test Name')).toHaveClass('text-sm');
  });

  it('renders audio controls when audio_url is present', () => {
    render(
      <NameCard
        name={{ ...name, audio_url: 'https://test.com/test_audio.mp3' }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Play audio' }),
    ).toBeInTheDocument();
  });
});
