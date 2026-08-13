import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authMockState, resetAuthMock } from '../../test/mocks';
import { CopyUserId } from './CopyUserId';

vi.mock('../../auth', () => ({
  useAuth: () => authMockState,
}));

describe('CopyUserId', () => {
  beforeEach(() => {
    resetAuthMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('copies the user id to the clipboard and shows confirmation for short time', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(<CopyUserId />);

    const button = screen.getByRole('button', {
      name: /copy my id for sharing/i,
    });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledWith('user-123');
    const copiedButton = screen.getByRole('button', {
      name: /copied to clipboard/i,
    });
    expect(copiedButton).toBeInTheDocument();
    expect(copiedButton).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    const readyButton = screen.getByRole('button', {
      name: /copy my id for sharing/i,
    });
    expect(readyButton).toBeInTheDocument();
    expect(readyButton).toBeEnabled();
  });

  it('renders nothing when there is no signed-in user id', () => {
    authMockState.userId = null;
    const { container } = render(<CopyUserId />);

    expect(container).toBeEmptyDOMElement();
  });
});
