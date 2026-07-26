import { KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth';
import { ApiError } from '../lib/api';
import { Layout } from './layout';

export function LoginPage() {
  const { handleLogin, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await handleLogin({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <Layout
      title="Welcome back"
      cta="Sign in"
      onSubmit={handleSubmit}
      disabledSubmit={loading || !emailValid || !passwordValid}
      error={error}
    >
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
          />
        </label>
      </div>
    </Layout>
  );
}
