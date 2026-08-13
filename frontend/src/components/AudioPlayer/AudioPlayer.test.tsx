import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockAudio,
  mockAudioApi,
  type MockAudio,
} from '../../test/mocks';
import { AudioPlayer } from './AudioPlayer';

describe('AudioPlayer', () => {
  let mockAudio: MockAudio;

  beforeEach(() => {
    // Mock the Audio API with a mock audio element
    mockAudio = mockAudioApi(createMockAudio());
  });

  afterEach(() => {
    // Reset all global mocks
    vi.unstubAllGlobals();
  });

  it('renders nothing without an audio url', () => {
    const { container } = render(<AudioPlayer audioUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('creates an audio element and shows controls', () => {
    render(<AudioPlayer audioUrl="https://test.com/test_audio.mp3" />);

    expect(Audio).toHaveBeenCalledWith('https://test.com/test_audio.mp3');
    expect(mockAudio.preload).toBe('none');
    expect(
      screen.getByRole('button', { name: 'Play audio' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause audio' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Restart audio' }),
    ).toBeDisabled();
  });

  it('plays audio and enables pause/restart', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer audioUrl="https://test.com/test_audio.mp3" />);

    // Play audio
    await user.click(screen.getByRole('button', { name: 'Play audio' }));

    // Check that the audio played
    expect(mockAudio.play).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Play audio' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pause audio' })).toBeEnabled();
  });

  it('pauses audio when pause is clicked', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer audioUrl="https://test.com/test_audio.mp3" />);

    // Play audio
    await user.click(screen.getByRole('button', { name: 'Play audio' }));

    // Pause audio
    await user.click(screen.getByRole('button', { name: 'Pause audio' }));

    // Check that the audio paused
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play audio' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Pause audio' })).toBeDisabled();
  });

  it('restarts audio and pauses it', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer audioUrl="https://test.com/test_audio.mp3" />);

    // Play audio
    await user.click(screen.getByRole('button', { name: 'Play audio' }));

    // Set the current time to 3 seconds and check that the restart button is enabled
    mockAudio.currentTime = 3;
    act(() => mockAudio.dispatch('timeupdate'));
    expect(screen.getByRole('button', { name: 'Restart audio' })).toBeEnabled();

    // Restart audio
    await user.click(screen.getByRole('button', { name: 'Restart audio' }));

    // Check that the audio restarted
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
    expect(screen.getByRole('button', { name: 'Pause audio' })).toBeDisabled();
  });

  it('resets currentTime when playing after ended', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer audioUrl="https://test.com/test_audio.mp3" />);

    // Set the audio to ended and the current time to 10 seconds
    mockAudio.ended = true;
    mockAudio.currentTime = 10;

    // Play audio
    await user.click(screen.getByRole('button', { name: 'Play audio' }));

    // Check that the audio restarted
    expect(mockAudio.currentTime).toBe(0);
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('stops playing when the audio ends', () => {
    render(<AudioPlayer audioUrl="https://test.com/test_audio.mp3" />);

    // Set the audio to ended
    act(() => {
      mockAudio.dispatch('ended');
    });

    // Check that the play button is enabled
    expect(screen.getByRole('button', { name: 'Play audio' })).toBeEnabled();
  });

  it('cleans up listeners on unmount', () => {
    // Render the audio player
    const { unmount } = render(
      <AudioPlayer audioUrl="https://test.com/test_audio.mp3" />,
    );

    // Unmount the audio player
    unmount();

    // Check that the audio paused and the event listener was removed
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.removeEventListener).toHaveBeenCalled();
  });

  it('uses compact styles for size xs', () => {
    const { container } = render(
      <AudioPlayer audioUrl="https://test.com/test_audio.mp3" size="xs" />,
    );

    expect(container.querySelector('.badge')).toHaveClass('badge-sm');
  });
});
