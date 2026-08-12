import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api';
import { ResetPasswordPage } from './ResetPasswordPage';

const handleResetPassword = vi.fn();

vi.mock('../auth', () => ({
  useAuth: () => ({
    handleResetPassword,
    loading: false,
  }),
}));

function renderResetPage(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    handleResetPassword.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows an error when the token is missing', () => {
    renderResetPage('/reset-password');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This reset link is invalid or incomplete.',
    );
    expect(
      screen.getByRole('button', { name: 'Update password' }),
    ).toBeDisabled();
  });

  it('does not submit when the token is missing', () => {
    const { container } = renderResetPage('/reset-password');

    fireEvent.submit(container.querySelector('form')!);

    expect(handleResetPassword).not.toHaveBeenCalled();
  });

  it('updates the password through auth', async () => {
    const user = userEvent.setup();
    handleResetPassword.mockResolvedValue(undefined);

    renderResetPage('/reset-password?token=valid-token');

    await user.type(
      screen.getByPlaceholderText('New password'),
      'new-password',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm password'),
      'new-password',
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() =>
      expect(handleResetPassword).toHaveBeenCalledWith(
        'valid-token',
        'new-password',
      ),
    );
  });

  it('shows an error when passwords do not match', async () => {
    const user = userEvent.setup();

    renderResetPage('/reset-password?token=valid-token');

    await user.type(
      screen.getByPlaceholderText('New password'),
      'new-password',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm password'),
      'different',
    );

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update password' }),
    ).toBeDisabled();
  });

  it('shows an ApiError message when reset fails', async () => {
    const user = userEvent.setup();
    handleResetPassword.mockRejectedValue(
      new ApiError(400, 'Invalid or expired password reset token'),
    );

    renderResetPage('/reset-password?token=valid-token');

    await user.type(
      screen.getByPlaceholderText('New password'),
      'new-password',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm password'),
      'new-password',
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid or expired password reset token',
    );
  });

  it('shows generic error for unexpected failures', async () => {
    const user = userEvent.setup();
    handleResetPassword.mockRejectedValue('boom');

    renderResetPage('/reset-password?token=valid-token');

    await user.type(
      screen.getByPlaceholderText('New password'),
      'new-password',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm password'),
      'new-password',
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong',
    );
  });
});
