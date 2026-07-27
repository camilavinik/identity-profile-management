import { useCallback, useEffect, useState } from 'react';
import { Header, MyNames, NameHistory } from '../components';
import {
  useNames,
  type Context,
  type HistoryPage,
  type NameEntry,
} from '../hooks';

export function Dashboard() {
  const { fetchCurrentNames, fetchHistory, fetchContexts } = useNames();

  const [names, setNames] = useState<NameEntry[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [namesError, setNamesError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [contexts, setContexts] = useState<Context[]>([]);

  useEffect(() => {
    fetchCurrentNames()
      .then(setNames)
      .catch((err: Error) => setNamesError(err.message))
      .finally(() => setNamesLoading(false));
  }, [fetchCurrentNames]);

  useEffect(() => {
    fetchHistory()
      .then(setHistory)
      .catch((err: Error) => setHistoryError(err.message))
      .finally(() => setHistoryLoading(false));
  }, [fetchHistory]);

  useEffect(() => {
    fetchContexts()
      .then(setContexts)
      .catch(() => {
        // Filters and modal selects will show empty if this fails
      });
  }, [fetchContexts]);

  const refreshAll = useCallback(() => {
    setNamesLoading(true);
    setNamesError(null);
    fetchCurrentNames()
      .then(setNames)
      .catch((err: Error) => setNamesError(err.message))
      .finally(() => setNamesLoading(false));

    setHistoryLoading(true);
    setHistoryError(null);
    fetchHistory()
      .then(setHistory)
      .catch((err: Error) => setHistoryError(err.message))
      .finally(() => setHistoryLoading(false));
  }, [fetchCurrentNames, fetchHistory]);

  return (
    <div className="min-h-screen bg-base-200">
      <Header />
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MyNames
              names={names}
              contexts={contexts}
              loading={namesLoading}
              error={namesError}
              refresh={refreshAll}
            />
          </div>
          <div className="lg:col-span-1">
            <NameHistory
              history={history}
              contexts={contexts}
              loading={historyLoading}
              error={historyError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
