import { ArrowLeft, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorAlert, ThemeToggle } from '../components';
import { API_DOCS_URL } from '../lib/apiDocs';

type Props = {
  title: string;
  cta: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  disabledSubmit: boolean;
  error?: string | null;
  success?: string | null;
  showApiDocs?: boolean;
  showAuthTabs?: boolean;
  showBackToLogin?: boolean;
};

export function Layout({
  title,
  cta,
  onSubmit,
  children,
  disabledSubmit,
  error,
  success,
  showApiDocs = true,
  showAuthTabs = true,
  showBackToLogin = false,
}: Props) {
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-3">
      <div className="fixed top-4 right-4">
        <ThemeToggle size="md" />
      </div>
      <div className="w-full max-w-md">
        <p className="font-logo mb-3 text-center text-4xl font-semibold">
          nomina
        </p>
        <div className="card w-full shadow-md border border-base-300">
          <form className="card-body gap-4" onSubmit={onSubmit}>
            {showAuthTabs && (
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
            )}

            <h1 className="card-title text-2xl">{title}</h1>

            {children}

            {error && <ErrorAlert content={error} />}
            {success && (
              <div
                role="alert"
                className="alert alert-success alert-soft text-sm"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-neutral w-full shadow-xs"
              disabled={disabledSubmit}
            >
              {cta}
            </button>

            {showApiDocs && (
              <>
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
              </>
            )}
          </form>
        </div>
        {showBackToLogin && (
          <Link to="/login" className="btn btn-ghost btn-sm mt-2 gap-1.5 px-2">
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        )}
      </div>
    </div>
  );
}
