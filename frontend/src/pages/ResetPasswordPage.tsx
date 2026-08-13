import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { ApiError } from '../lib/api';
import { Layout } from './layout';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { handleResetPassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : 'This reset link is invalid or incomplete.',
  );
  const passwordMismatch = confirmPassword && password !== confirmPassword;
  const isInvalid =
    !token || !passwordValid || !confirmPasswordValid || !!passwordMismatch;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    try {
      await handleResetPassword(token, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <Layout
      title="Reset password"
      cta="Update password"
      onSubmit={handleSubmit}
      disabledSubmit={loading || isInvalid}
      error={error}
      showApiDocs={false}
      showAuthTabs={false}
      showBackToLogin
    >
      <p className="text-sm text-base-content/60 -mt-2">
        Choose a new password for your account.
      </p>
      <div>
        <label className="input validator w-full">
          <KeyRound className="size-4 opacity-50" />
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordValid(e.target.validity.valid);
            }}
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={!token}
          />
        </label>
        <p className="validator-hint hidden mt-0.5">
          Must be at least {MIN_PASSWORD_LENGTH} characters
        </p>
      </div>
      <div>
        <label
          className={`input validator w-full ${passwordMismatch ? 'input-error' : ''}`}
        >
          <KeyRound className="size-4 opacity-50" />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmPasswordValid(e.target.validity.valid);
            }}
            required
            disabled={!token}
          />
        </label>
        {passwordMismatch && (
          <p className="text-error text-xs mt-0.5">Passwords do not match</p>
        )}
      </div>
    </Layout>
  );
}
