import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import { useSession } from './lib/auth';
import { Leaf, Loader2, Users } from 'lucide-react';

function ProtectedRoute({ children, reverse = false }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="brand-icon-box" style={{ width: '48px', height: '48px' }}>
          <Leaf size={26} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-600)', fontSize: '0.95rem', fontWeight: 500 }}>
          <Loader2 size={20} className="spinner" style={{ color: 'var(--primary)' }} />
          <span>Carregando NutriTQ...</span>
        </div>
      </div>
    );
  }

  if (reverse) {
    return session ? <Navigate to="/dashboard" replace /> : children;
  }

  return session ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/login" element={
          <ProtectedRoute reverse>
            <Login />
          </ProtectedRoute>
        } />
        
        <Route path="/register" element={
          <ProtectedRoute reverse>
            <Register />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Rota para Pacientes */}
        <Route path="/pacientes/*" element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <header className="dashboard-topbar">
                  <div className="greeting-section">
                    <h2>Gestão de Pacientes</h2>
                    <p>Cadastre, acompanhe e gerencie fichas clínicas e planos alimentares.</p>
                  </div>
                </header>
                <div className="stat-card" style={{ padding: '48px 32px', textAlign: 'center', alignItems: 'center' }}>
                  <div className="empty-state-icon" style={{ width: '60px', height: '60px', marginBottom: '16px' }}>
                    <Users size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
                    Módulo de Pacientes
                  </h3>
                  <p style={{ maxWidth: '420px', color: 'var(--slate-500)', fontSize: '0.925rem' }}>
                    A visualização detalhada de prontuários, antropometria e planos alimentares está pronta para conexão com as tabelas do Neon.
                  </p>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
