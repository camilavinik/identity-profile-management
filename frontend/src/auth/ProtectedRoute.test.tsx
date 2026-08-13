import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

const useAuth = vi.fn();

vi.mock('./AuthContext', () => ({
  useAuth: () => useAuth(),
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>Private route content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading indicator while auth is loading', () => {
    useAuth.mockReturnValue({ token: null, loading: true });

    const { container } = renderProtected();

    expect(container.querySelector('.loading')).toBeInTheDocument();
    expect(screen.queryByText('Private route content')).not.toBeInTheDocument();
  });

  it('renders children when the user is authenticated', () => {
    useAuth.mockReturnValue({ token: 'token', loading: false });

    renderProtected();

    expect(screen.getByText('Private route content')).toBeInTheDocument();
  });

  it('redirects to login when there is no token', () => {
    useAuth.mockReturnValue({ token: null, loading: false });

    renderProtected();

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Private route content')).not.toBeInTheDocument();
  });
});
