import { Header, MyNames, NameHistory } from '../components';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-base-200">
      <Header />
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MyNames />
          </div>
          <div className="lg:col-span-1">
            <NameHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
