import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import type { Context } from '../hooks';
import { API_DOCS_URL } from '../lib/apiDocs';
import { Options } from './Options';
import { UserSearchModal } from './UserSearchModal';
import { BookOpen, LogOut } from 'lucide-react';

export function Header({ contexts }: { contexts: Context[] }) {
  const { logout, email } = useAuth();
  const { userId: searchedUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(searchedUserId ?? '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = searchValue.trim();
    if (!trimmed) return;

    navigate(`/${trimmed}`);
  };

  return (
    <header className="navbar bg-base-100 shadow-xs px-0">
      <div className="container mx-auto flex items-center px-4">
        <div className="navbar-start flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">IPM</h1>{' '}
          <span className="text-sm text-gray-500">
            Identity Profile Management
          </span>
        </div>
        <form className="navbar-center join" onSubmit={handleSearch}>
          <label className="input input-sm join-item w-72">
            <Users className="size-4 opacity-50" />
            <input
              type="search"
              placeholder="Find another user by id"
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
        <div className="navbar-end flex items-center gap-2">
          {email && <span className="text-sm text-gray-500">{email}</span>}
          <Options>
            <li>
              <a href={API_DOCS_URL} target="_blank" rel="noreferrer">
                <BookOpen className="size-4" />
                API Documentation
              </a>
            </li>
            <li>
              <button onClick={logout}>
                <LogOut className="size-4" />
                Log Out
              </button>
            </li>
          </Options>
        </div>
      </div>
      {searchedUserId && (
        <UserSearchModal
          key={searchedUserId}
          open
          userId={searchedUserId}
          contexts={contexts}
          onClose={() => navigate('/')}
        />
      )}
    </header>
  );
}
