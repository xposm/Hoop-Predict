// App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/layout';

// Lazy load pages
const WelcomePage = lazy(() => import('./pages/landing'));
const FirstTeam = lazy(() => import('./pages/firstTeam'));
const SecondTeam = lazy(() => import('./pages/secondTeam'));
const ResultPage = lazy(() => import('./pages/ResultPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Landing / Welcome page */}
            <Route index element={<WelcomePage />} />

            {/* Team selection pages */}
            <Route path="firstTeam" element={<FirstTeam />} />
            <Route path="secondTeam" element={<SecondTeam />} />

            {/* Result page */}
            <Route path="result" element={<ResultPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
