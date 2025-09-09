// App.tsx or your main router file
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/layout';

// Lazy load the team selection pages
const FirstTeam = lazy(() => import('./pages/firstTeam'));
const SecondTeam = lazy(() => import('./pages/secondTeam'));

// You can also lazy load other pages
const WelcomePage = lazy(() => import('./pages/landing'));

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
            <Route index element={<WelcomePage />} />
            <Route path="firstTeam" element={<FirstTeam />} />
            <Route path="secondTeam" element={<SecondTeam />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
