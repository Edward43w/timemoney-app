import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signInWithGoogle } from '../../authService';
import { LoginPage } from '../../components/LoginPage';

vi.mock('../../authService', () => ({
  signInWithGoogle: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(signInWithGoogle).mockReset();
  });

  it('starts Google sign-in from the primary action', async () => {
    vi.mocked(signInWithGoogle).mockResolvedValue({} as never);
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '使用 Google 繼續' }));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a readable error when sign-in fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(signInWithGoogle).mockRejectedValue(new Error('登入視窗被阻擋'));
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '使用 Google 繼續' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('登入失敗：登入視窗被阻擋');
    expect(screen.getByRole('button', { name: '使用 Google 繼續' })).toBeEnabled();
  });

  it('disables repeated login attempts while a request is pending', async () => {
    let resolveLogin: (() => void) | undefined;
    vi.mocked(signInWithGoogle).mockImplementation(() => new Promise((resolve) => {
      resolveLogin = () => resolve({} as never);
    }));
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '使用 Google 繼續' }));

    expect(screen.getByRole('button', { name: '正在登入…' })).toBeDisabled();
    await act(async () => resolveLogin?.());
    expect(screen.getByRole('button', { name: '使用 Google 繼續' })).toBeEnabled();
  });
});
