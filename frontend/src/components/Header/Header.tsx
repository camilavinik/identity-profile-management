import { BookOpen, CircleHelp, LogOut, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth';
import type { Context } from '../../hooks';
import { API_DOCS_URL } from '../../lib/apiDocs';
import { HowItWorksModal } from '../HowItWorksModal/HowItWorksModal';
import { Options } from '../Options/Options';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { UserSearchModal } from '../UserSearchModal/UserSearchModal';

export function Header({ contexts }: { contexts: Context[] }) {
  const { logout, email, howItWorksOpen, setHowItWorksOpen } = useAuth();
  const { userId: searchParam } = useParams<{ userId?: string }>();
  const searched = searchParam ? decodeURIComponent(searchParam) : undefined;
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(searched ?? '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = searchValue.trim();
    if (!trimmed) return;

    navigate(`/${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="bg-base-100 shadow-xs">
      <div className="container mx-auto grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 px-4 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:py-2">
        <div className="flex items-baseline gap-2">
          <h1 className="font-logo text-3xl font-semibold">nomina</h1>
          <span className="hidden text-xs text-gray-500 sm:inline">
            Personal Identity Management
          </span>
        </div>

        <div className="flex items-center gap-2 justify-self-end lg:order-3">
          {email && <span className="text-sm text-gray-500">{email}</span>}
          <ThemeToggle />
          <Options>
            <li>
              <button type="button" onClick={() => setHowItWorksOpen(true)}>
                <CircleHelp className="size-4" />
                How it works
              </button>
            </li>
            <li>
              <a href={API_DOCS_URL} target="_blank" rel="noreferrer">
                <BookOpen className="size-4" />
                API Documentation
              </a>
            </li>
            <li>
              <button type="button" onClick={logout}>
                <LogOut className="size-4" />
                Log Out
              </button>
            </li>
          </Options>
        </div>

        <form
          className="join col-span-2 w-full lg:col-span-1 lg:order-2 lg:max-w-md lg:justify-self-center"
          onSubmit={handleSearch}
        >
          <label className="input input-sm join-item min-w-0 flex-1">
            <Users className="size-4 shrink-0 opacity-50" />
            <input
              type="search"
              placeholder="Find user by id or email"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </label>
          <button
            type="submit"
            aria-label="Search"
            disabled={!searchValue.trim()}
            className="btn btn-neutral btn-sm join-item shadow-xs"
          >
            <Search className="size-4" />
          </button>
        </form>
      </div>
      {searched && (
        <UserSearchModal
          key={searched}
          open
          searched={searched}
          contexts={contexts}
          onClose={() => navigate('/')}
        />
      )}
      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </header>
  );
}
