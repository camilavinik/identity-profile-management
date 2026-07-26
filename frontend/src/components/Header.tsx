import { useAuth } from '../auth';
import { Options } from './Options';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="navbar bg-base-100 shadow-xs">
      <div className="flex-1">
        <h1 className="text-xl">Identity Profile Management</h1>
      </div>
      <div className="flex-none">
        <Options>
          <li>
            <button onClick={logout}>Log Out</button>
          </li>
        </Options>
      </div>
    </header>
  );
}
