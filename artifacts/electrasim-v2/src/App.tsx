import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/Home';
import NotFound from '@/pages/not-found';

// The landing page remains immediate. Every assistant workspace is a genuine
// route chunk so opening the SEO hub or a lightweight calculator does not pull
// Three.js visualizers used by other engineering tools.
const Blog = lazy(() => import('@/pages/Blog'));
const AssistantHub = lazy(() => import('@/pages/assistant/AssistantHub'));
const CableSizePage = lazy(() => import('@/pages/assistant/tools/cable-size/CableSizePage'));
const VoltageDropPage = lazy(() => import('@/pages/assistant/tools/voltage-drop/VoltageDropPage'));
const LoadCalculatorPage = lazy(() => import('@/pages/assistant/tools/load-calculator/LoadCalculatorPage'));
const OhmsLawPage = lazy(() => import('@/pages/assistant/tools/ohms-law/OhmsLawPage'));
const CircuitProtectionPage = lazy(() => import('@/pages/assistant/tools/circuit-protection/CircuitProtectionPage'));
const ThreePhasePage = lazy(() => import('@/pages/assistant/tools/three-phase/ThreePhasePage'));
const EnergyCostPage = lazy(() => import('@/pages/assistant/tools/energy-cost/EnergyCostPage'));
const UnitConverterPage = lazy(() => import('@/pages/assistant/tools/unit-converter/UnitConverterPage'));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-9 w-9 animate-pulse rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25" />
        <p className="text-sm font-bold text-slate-900">Loading ElectraSim tools…</p>
        <p className="mt-1 text-xs text-slate-500">Preparing the engineering workspace</p>
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

        <Route path="/assistant/cable-size" component={CableSizePage} />
        <Route path="/assistant/voltage-drop" component={VoltageDropPage} />
        <Route path="/assistant/load-calculator" component={LoadCalculatorPage} />
        <Route path="/assistant/ohms-law" component={OhmsLawPage} />
        <Route path="/assistant/circuit-protection" component={CircuitProtectionPage} />
        <Route path="/assistant/three-phase" component={ThreePhasePage} />
        <Route path="/assistant/energy-cost" component={EnergyCostPage} />
        <Route path="/assistant/unit-converter" component={UnitConverterPage} />
        <Route path="/assistant" component={AssistantHub} />

        <Route path="/electrical-assistant"><Redirect to="/assistant" replace /></Route>
        <Route path="/assistant/cablesize"><Redirect to="/assistant/cable-size" replace /></Route>
        <Route path="/assistant/wire"><Redirect to="/assistant/voltage-drop" replace /></Route>
        <Route path="/assistant/voltagedrop"><Redirect to="/assistant/voltage-drop" replace /></Route>
        <Route path="/assistant/loadcalc"><Redirect to="/assistant/load-calculator" replace /></Route>
        <Route path="/assistant/breaker"><Redirect to="/assistant/load-calculator" replace /></Route>
        <Route path="/assistant/ohms"><Redirect to="/assistant/ohms-law" replace /></Route>
        <Route path="/assistant/mcb_rcbo"><Redirect to="/assistant/circuit-protection" replace /></Route>
        <Route path="/assistant/threephase"><Redirect to="/assistant/three-phase" replace /></Route>
        <Route path="/assistant/energycost"><Redirect to="/assistant/energy-cost" replace /></Route>
        <Route path="/assistant/converter"><Redirect to="/assistant/unit-converter" replace /></Route>

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
