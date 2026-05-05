import { Routes, Route, HashRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { RouteVisualizer } from './pages/RouteVisualizer';
import { StopVisualizer } from './pages/StopVisualizer';
import { CitySelection } from './pages/CitySelection';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoutePlanning } from './pages/RoutePlanning';
import { FleetOptimization } from './pages/FleetOptimization';
import { RouteStopSequence } from './pages/RouteStopSequence';
import { TransfersPreprocess } from './pages/TransfersPreprocess';
import { LandingPage } from './pages/LandingPage';
import { RouteVisualizer3D } from './pages/RouteVisualizer3D';

function App() {
  // Ensure previously chosen theme applies on every route load
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return (
    <HashRouter>
      <div className="pointer-events-none fixed bottom-2 left-3 z-50 text-xs text-slate-600 opacity-70 dark:text-slate-300">
        v{__APP_VERSION__}
      </div>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route path="/city-selection" element={
          <ProtectedRoute>
            <CitySelection />
          </ProtectedRoute>
        } />
        <Route path=":city" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path=":city/route-visualizer" element={
          <ProtectedRoute>
            <RouteVisualizer />
          </ProtectedRoute>
        } />
        <Route path=":city/route-visualizer-3d" element={
          <ProtectedRoute>
            <RouteVisualizer3D />
          </ProtectedRoute>
        } />
        <Route path=":city/stop-explorer" element={
          <ProtectedRoute>
            <StopVisualizer />
          </ProtectedRoute>
        } />
        <Route path=":city/route-planning" element={
          <ProtectedRoute>
            <RoutePlanning />
          </ProtectedRoute>
        } />
        <Route path=":city/route-stop-sequence" element={
          <ProtectedRoute allowDefaultCities>
            <RouteStopSequence />
          </ProtectedRoute>
        } />
        <Route path=":city/transfers-preprocess" element={
          <ProtectedRoute allowDefaultCities>
            <TransfersPreprocess />
          </ProtectedRoute>
        } />
        <Route path=":city/fleet-optimization" element={
          <ProtectedRoute>
            <FleetOptimization />
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;
