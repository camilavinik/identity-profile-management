import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOKEN_KEY } from '../auth/AuthContext';
import { ApiError, apiFetch } from './api';

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock the fetch API
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ ok: true }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('calls the backend URL with the given path', async () => {
    await apiFetch('/me/name');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/me\/name$/),
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('adds the Authorization header when a token exists', async () => {
    localStorage.setItem(TOKEN_KEY, 'test-token');

    await apiFetch('/me/name');

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
      .headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('sets Content-Type for JSON bodies', async () => {
    await apiFetch('/me/name', {
      method: 'POST',
      body: JSON.stringify({ charset: 'latin' }),
    });

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
      .headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('does not set Content-Type for FormData bodies', async () => {
    await apiFetch('/me/name/1/audio', {
      method: 'POST',
      body: new FormData(),
    });

    const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
      .headers as Headers;
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('returns the parsed JSON body on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ id: '1' }),
    } as Response);

    await expect(apiFetch('/me/name')).resolves.toEqual({ id: '1' });
  });

  it('throws ApiError with the server message when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid charset' }),
    } as Response);

    const error = await apiFetch('/me/name').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'Invalid charset',
    });
  });

  it('joins array validation messages from API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: ['too short', 'required'] }),
    } as Response);

    await expect(apiFetch('/me/name')).rejects.toThrow('too short, required');
  });

  it('falls back when there is no message body from API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('no json');
      },
    } as unknown as Response);

    await expect(apiFetch('/me/name')).rejects.toThrow('Internal Server Error');
  });

  it('clears the token and redirects to login on 401 from API', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired');
    const location = { href: '' };
    vi.stubGlobal('location', location);

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthorized' }),
    } as Response);

    await expect(apiFetch('/me/name')).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(location.href).toBe('/login');
  });

  it('uses VITE_BACKEND_URL when it is defined', async () => {
    vi.stubEnv('VITE_BACKEND_URL', 'https://test.com');

    await apiFetch('/me/name');

    expect(fetch).toHaveBeenCalledWith(
      'https://test.com/me/name',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );

    vi.unstubAllEnvs();
  });

  it('falls back to localhost when VITE_BACKEND_URL is not defined', async () => {
    vi.stubEnv('VITE_BACKEND_URL', undefined as unknown as string);

    await apiFetch('/me/name');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/me/name',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );

    vi.unstubAllEnvs();
  });
});
