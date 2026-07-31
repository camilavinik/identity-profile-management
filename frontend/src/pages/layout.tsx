import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components';
import { API_DOCS_URL } from '../lib/apiDocs';

type Props = {
  title: string;
  cta: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  disabledSubmit: boolean;
  error?: string | null;
};

export function Layout({
  title,
  cta,
  onSubmit,
  children,
  disabledSubmit,
  error,
}: Props) {
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-3">
      <div className="card w-full max-w-md shadow-md">
        <div className="card-body gap-4">
          <div role="tablist" className="tabs tabs-box self-center">
            <input
              type="radio"
              name="auth-tabs"
              role="tab"
              aria-label="Sign up"
              className="tab"
              checked={isSignup}
              onChange={() => navigate('/signup')}
            />
            <input
              type="radio"
              name="auth-tabs"
              role="tab"
              aria-label="Sign in"
              className="tab"
              checked={!isSignup}
              onChange={() => navigate('/login')}
            />
          </div>

          <h1 className="card-title text-2xl">{title}</h1>

          {children}

          {error && <ErrorAlert content={error} />}

          <button
            type="submit"
            className="btn btn-neutral w-full shadow-xs"
            onClick={(e) =>
              onSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
            }
            disabled={disabledSubmit}
          >
            {cta}
          </button>

          <div className="divider my-1">OR</div>

          <a
            href={API_DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="btn w-full shadow-xs"
          >
            <BookOpen className="size-4" />
            API Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
