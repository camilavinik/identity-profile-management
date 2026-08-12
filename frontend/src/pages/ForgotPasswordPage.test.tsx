import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api';
import { ForgotPasswordPage } from './ForgotPasswordPage';

const handleForgotPassword = vi.fn();

vi.mock('../auth', () => ({
  useAuth: () => ({
    handleForgotPassword,
    loading: false,
  }),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    handleForgotPassword.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends a reset link for a valid email', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    handleForgotPassword.mockResolvedValue(
      'A password reset email has been sent to the provided email address if the user exists.',
    );

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() =>
      expect(handleForgotPassword).toHaveBeenCalledWith('user@test.com'),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A password reset email has been sent',
    );
    expect(
      screen.getByRole('button', { name: 'Resend in 30s' }),
    ).toBeDisabled();
  });

  it('counts down the resend cooldown', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    handleForgotPassword.mockResolvedValue('ok');

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByRole('button', { name: 'Resend in 30s' }),
    ).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole('button', { name: 'Resend in 29s' }),
    ).toBeDisabled();

    for (let i = 0; i < 29; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeEnabled();
  });

  it('does not submit while the cooldown is active', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    handleForgotPassword.mockResolvedValue('ok');

    const { container } = render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    await screen.findByRole('button', { name: 'Resend in 30s' });

    fireEvent.submit(container.querySelector('form')!);

    expect(handleForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('shows an ApiError message when sending fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    handleForgotPassword.mockRejectedValue(
      new ApiError(503, 'Email service is not configured'),
    );

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email service is not configured',
    );
    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeEnabled();
  });

  it('shows a generic error for unexpected failures', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    handleForgotPassword.mockRejectedValue('boom');

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email'), 'user@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong',
    );
  });
});
