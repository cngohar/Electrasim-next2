import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/Home';
import NotFound from '@/pages/not-found';

const Blog = lazy(() => import('@/pages/Blog'));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-9 w-9 animate-pulse rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25" />
        <p className="text-sm font-bold text-slate-900">Loading ElectraSim…</p>
      </div>
    </main>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/blog" component={Blog} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

