import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testName } from '../test/fixtures';
import { useNames } from './useNames';

const apiFetch = vi.fn();

vi.mock('../lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

describe('useNames', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it('fetches current names, history, contexts and user names', async () => {
    const { result } = renderHook(() => useNames());

    apiFetch.mockResolvedValueOnce([testName]);
    await expect(result.current.fetchCurrentNames()).resolves.toEqual([
      testName,
    ]);
    expect(apiFetch).toHaveBeenCalledWith('/me/name');

    apiFetch.mockResolvedValueOnce({ data: [], total: 0 });
    await result.current.fetchHistory();
    expect(apiFetch).toHaveBeenCalledWith('/me/name/history');

    apiFetch.mockResolvedValueOnce([]);
    await result.current.fetchContexts();
    expect(apiFetch).toHaveBeenCalledWith('/contexts');

    apiFetch.mockResolvedValueOnce([testName]);
    await result.current.fetchUserNamesById('user-1');
    expect(apiFetch).toHaveBeenCalledWith('/user/user-1/name');
  });

  it('creates a name without uploading audio', async () => {
    const { result } = renderHook(() => useNames());
    apiFetch.mockResolvedValueOnce(testName);

    await expect(
      result.current.createName({
        context: 'legal',
        charset: 'latin',
        value: 'test',
      }),
    ).resolves.toEqual(testName);

    expect(apiFetch).toHaveBeenCalledOnce();
    expect(apiFetch).toHaveBeenCalledWith('/me/name', {
      method: 'POST',
      body: JSON.stringify({
        context: 'legal',
        charset: 'latin',
        value: 'test',
      }),
    });
  });

  it('uploads audio after creating a name when a file is provided', async () => {
    const { result } = renderHook(() => useNames());
    const file = new File(['audio'], 'test_audio.mp3', { type: 'audio/mpeg' });
    const withAudio = {
      ...testName,
      audio_url: 'https://test.com/test_audio.mp3',
    };

    apiFetch.mockResolvedValueOnce(testName).mockResolvedValueOnce(withAudio);

    await expect(
      result.current.createName({
        context: 'legal',
        charset: 'latin',
        audioFile: file,
      }),
    ).resolves.toEqual(withAudio);

    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(apiFetch).toHaveBeenLastCalledWith('/me/name/1/audio', {
      method: 'POST',
      body: expect.any(FormData),
    });
  });

  it('updates a name without changing audio', async () => {
    const { result } = renderHook(() => useNames());
    apiFetch.mockResolvedValueOnce(testName);

    await expect(
      result.current.updateName('1', {
        context: 'legal',
        charset: 'latin',
        value: 'updated',
      }),
    ).resolves.toEqual(testName);

    expect(apiFetch).toHaveBeenCalledOnce();
    expect(apiFetch).toHaveBeenCalledWith('/me/name/1', {
      method: 'PATCH',
      body: JSON.stringify({
        context: 'legal',
        charset: 'latin',
        value: 'updated',
      }),
    });
  });

  it('uploads audio when update includes a new file', async () => {
    const { result } = renderHook(() => useNames());
    const file = new File(['audio'], 'test_audio.mp3', { type: 'audio/mpeg' });
    const withAudio = {
      ...testName,
      audio_url: 'https://test.com/test_audio.mp3',
    };

    apiFetch.mockResolvedValueOnce(testName).mockResolvedValueOnce(withAudio);

    await expect(
      result.current.updateName('1', {
        charset: 'latin',
        audioFile: file,
      }),
    ).resolves.toEqual(withAudio);

    expect(apiFetch).toHaveBeenLastCalledWith('/me/name/1/audio', {
      method: 'POST',
      body: expect.any(FormData),
    });
  });

  it('deletes audio when update sets removeAudio', async () => {
    const { result } = renderHook(() => useNames());
    const withoutAudio = { ...testName, audio_url: null };

    apiFetch
      .mockResolvedValueOnce(testName)
      .mockResolvedValueOnce(withoutAudio);

    await expect(
      result.current.updateName('1', {
        charset: 'latin',
        removeAudio: true,
      }),
    ).resolves.toEqual(withoutAudio);

    expect(apiFetch).toHaveBeenLastCalledWith('/me/name/1/audio', {
      method: 'DELETE',
    });
  });
});
