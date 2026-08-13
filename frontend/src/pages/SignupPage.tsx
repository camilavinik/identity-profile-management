import { KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth';
import { ApiError } from '../lib/api';
import { Layout } from './layout';

const MIN_PASSWORD_LENGTH = 8;

export function SignupPage() {
  const { handleSignup, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = confirmPassword && password !== confirmPassword;
  const isInvalid =
    !emailValid ||
    !passwordValid ||
    !confirmPasswordValid ||
    !!passwordMismatch;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await handleSignup({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <Layout
      title="Create an account"
      cta="Create an account"
      onSubmit={handleSubmit}
      disabledSubmit={loading || isInvalid}
      error={error}
    >
      <div>
        <label className="input validator w-full">
          <Mail className="size-4 opacity-50" />
          <input
            type="email"
            placeholder="mail@site.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailValid(e.target.validity.valid);
            }}
            required
          />
        </label>
        <div className="validator-hint hidden mt-0.5">
          Enter a valid email address
        </div>
      </div>

      <div>
        <label className="input validator w-full">
          <KeyRound className="size-4 opacity-50" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordValid(e.target.validity.valid);
            }}
            required
            minLength={MIN_PASSWORD_LENGTH}
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
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmPasswordValid(e.target.validity.valid);
            }}
            required
          />
        </label>
        {passwordMismatch && (
          <p className="text-error text-xs mt-0.5">Passwords do not match</p>
        )}
      </div>
    </Layout>
  );
}
