// App.tsx or your main router file
import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/layout';
import ResultHistory from './pages/resultHistory';
import SettingsPage from './pages/setting';

// Lazy load the team selection pages
const FirstTeam = lazy(() => import('./pages/firstTeam'));
const SecondTeam = lazy(() => import('./pages/secondTeam'));

// You can also lazy load other pages
const WelcomePage = lazy(() => import('./pages/landing'));

function App() {
  return (
    <HashRouter>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<WelcomePage />} />
            <Route path="firstTeam" element={<FirstTeam />} />
            <Route path="secondTeam" element={<SecondTeam />} />
            <Route path="resultHistory" element={<ResultHistory />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
