import { useAuth } from '../auth';
import { Options } from './Options';

export function Header() {
  const { logout, email } = useAuth();

  return (
    <header className="navbar bg-base-100 shadow-xs px-0">
      <div className="container mx-auto flex items-center px-4">
        <div className="flex-1 flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">IPM</h1>{' '}
          <span className="text-sm text-gray-500">
            Identity Profile Management
          </span>
        </div>
        <div className="flex-none flex items-center gap-2">
          {email && <span className="text-sm text-gray-500">{email}</span>}
          <Options>
            <li>
              <button onClick={logout}>Log Out</button>
            </li>
          </Options>
        </div>
      </div>
    </header>
  );
}
