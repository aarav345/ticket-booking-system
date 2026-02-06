import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConcertPage } from './pages/ConcertPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-blue-600">
              🎫 Concert Tickets
            </h1>
          </div>
        </header>
        <main className="pb-12">
          <ConcertPage />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;