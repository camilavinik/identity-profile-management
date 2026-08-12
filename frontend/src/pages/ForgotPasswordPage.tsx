import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ApiError } from '../lib/api';
import { Layout } from './layout';

const RESEND_COOLDOWN_SECONDS = 30;

export function ForgotPasswordPage() {
  const { handleForgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const id = window.setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setError(null);
    setSuccess(null);
    try {
      const message = await handleForgotPassword(email.trim());
      setSuccess(message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <Layout
      title="Forgot password"
      cta={cooldown > 0 ? `Resend in ${cooldown}s` : 'Send reset link'}
      onSubmit={handleSubmit}
      disabledSubmit={loading || !emailValid || cooldown > 0}
      error={error}
      success={success}
      showApiDocs={false}
      showAuthTabs={false}
      showBackToLogin
    >
      <p className="text-sm text-base-content/60 -mt-2">
        Enter your account email and we will send you a link to reset your
        password.
      </p>
      <div>
        <label className="input validator w-full">
          <Mail className="size-4 opacity-50" />
          <input
            type="email"
            placeholder="Email"
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
    </Layout>
  );
}
