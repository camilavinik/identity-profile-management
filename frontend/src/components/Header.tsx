import { useAuth } from '../auth';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="navbar bg-base-100 shadow-xs">
      <div className="flex-1">
        <h1 className="text-xl">Identity Profile Management</h1>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-hover dropdown-bottom dropdown-end">
          <div tabIndex={0}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-5 w-5 stroke-current"
            >
              {' '}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              ></path>{' '}
            </svg>
          </div>
          <ul
            tabIndex={-1}
            className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-xs"
          >
            <li>
              <button onClick={logout}>Log Out</button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
