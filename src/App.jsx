import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import PacienteDetalhes from './pages/PacienteDetalhes';
import { useSession } from './lib/auth';
import { Leaf, Loader2 } from 'lucide-react';

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

        {/* Gestão de Pacientes */}
        <Route path="/pacientes" element={
          <ProtectedRoute>
            <Pacientes />
          </ProtectedRoute>
        } />

        {/* Perfil & Detalhes do Paciente (Consultas + Planos com IA) */}
        <Route path="/pacientes/:id" element={
          <ProtectedRoute>
            <PacienteDetalhes />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
