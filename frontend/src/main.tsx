import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import KnowledgeBase from './pages/KnowledgeBase';
import RoutesPage from './pages/Routes';
import RolesPage from './pages/Roles';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Playground from './pages/Playground';
import Embed from './pages/Embed';
import './styles.css';

function App() {
  return (
    <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/embed" element={<Embed />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
