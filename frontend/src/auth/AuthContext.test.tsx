import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, TOKEN_KEY, useAuth } from './AuthContext';

const apiFetch = vi.fn();
const navigate = vi.fn();

// AuthProvider only reads the middle part as JSON
const token = `x.${btoa(JSON.stringify({ email: 'test@email.com' }))}.x`;

vi.mock('../lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    apiFetch.mockReset();
    navigate.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('reads the token from localStorage on start', () => {
    localStorage.setItem(TOKEN_KEY, token);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe(token);
    expect(result.current.email).toBe('test@email.com');
  });

  it('logs in, stores the token and navigates dashboard', async () => {
    apiFetch.mockResolvedValue({ access_token: token });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.handleLogin({
        email: 'test@email.com',
        password: 'password',
      });
    });

    expect(result.current.token).toBe(token);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@email.com',
        password: 'password',
      }),
    });
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('signs up, stores the token and navigates home', async () => {
    apiFetch.mockResolvedValue({ access_token: token });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.handleSignup({
        email: 'test@email.com',
        password: 'password',
      });
    });

    expect(result.current.token).toBe(token);
    expect(apiFetch).toHaveBeenCalledWith('/auth/signup', expect.any(Object));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('logs out and clears the token', async () => {
    localStorage.setItem(TOKEN_KEY, token);

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.token).toBeNull();
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('returns null email when the token payload is invalid', () => {
    localStorage.setItem(TOKEN_KEY, 'not-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.email).toBeNull();
  });

  it('returns null email when the token has no email claim', () => {
    localStorage.setItem(
      TOKEN_KEY,
      `x.${btoa(JSON.stringify({ sub: '1' }))}.x`,
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.email).toBeNull();
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside <AuthProvider>',
    );
  });
});
