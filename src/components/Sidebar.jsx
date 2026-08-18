import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Leaf } from 'lucide-react';
import { useSession, signOut } from '../lib/auth';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Nutricionista';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Leaf size={22} strokeWidth={2.2} />
          </div>
          <div className="sidebar-brand-text">
            <h1>NutriTQ</h1>
            <span className="badge">Sistema Clínico</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-title">Menu Principal</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-card">
          <div className="user-profile-info">
            <div className="user-avatar" title={userName}>
              {userInitial}
            </div>
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-role">Nutricionista</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn-sidebar-logout" 
            title="Sair do sistema"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
