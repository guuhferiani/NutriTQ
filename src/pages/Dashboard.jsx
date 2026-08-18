import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sql } from '../lib/db';
import { Users, Calendar, Clock, AlertCircle, ChevronRight, CheckCircle2, CalendarDays } from 'lucide-react';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Nutricionista';

  useEffect(() => {
    async function loadDashboardData() {
      if (!session?.user?.email) return;

      try {
        setLoading(true);
        // Primeiro, encontrar o nutricionista logado
        const nutriResult = await sql`
          SELECT id FROM nutricionistas WHERE email = ${session.user.email} LIMIT 1
        `;

        if (nutriResult.length === 0) {
          // Se não existir na tabela ainda, pode ser um usuário recém cadastrado
          setStats({
            totalPacientes: 0,
            consultasSemana: 0,
            pacientesSemRetorno: []
          });
          return;
        }

        const nutriId = nutriResult[0].id;

        // Total de pacientes
        const pacientesResult = await sql`
          SELECT COUNT(*) as total FROM pacientes WHERE nutricionista_id = ${nutriId}
        `;
        const totalPacientes = parseInt(pacientesResult[0]?.total || 0, 10);

        // Consultas da semana
        const consultasResult = await sql`
          SELECT COUNT(*) as total 
          FROM consultas c 
          JOIN pacientes p ON c.paciente_id = p.id 
          WHERE p.nutricionista_id = ${nutriId} 
          AND date_trunc('week', c.data_consulta) = date_trunc('week', current_date)
        `;
        const consultasSemana = parseInt(consultasResult[0]?.total || 0, 10);

        // Pacientes sem retorno (> 30 dias)
        const semRetornoResult = await sql`
          SELECT p.id, p.nome 
          FROM pacientes p 
          WHERE p.nutricionista_id = ${nutriId} 
          AND (
            SELECT MAX(data_consulta) 
            FROM consultas 
            WHERE paciente_id = p.id
          ) < current_date - interval '30 days'
          AND NOT EXISTS (
            SELECT 1 
            FROM consultas 
            WHERE paciente_id = p.id 
            AND proximo_retorno >= current_date
          )
        `;

        setStats({
          totalPacientes,
          consultasSemana,
          pacientesSemRetorno: semRetornoResult || []
        });
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError("Não foi possível carregar todas as informações do banco de dados.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [session]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="dashboard-topbar">
          <div className="greeting-section">
            <h2>Olá, {userName}! 👋</h2>
            <p>Confira o resumo das atividades clínicas e pacientes hoje.</p>
          </div>
          <div className="date-badge">
            <CalendarDays size={16} />
            <span>{capitalizedDate}</span>
          </div>
        </header>

        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="stats-grid">
          {/* Stat Card 1: Total Pacientes */}
          <div className="stat-card">
            <div className="stat-header">
              <h3>Total de Pacientes Ativos</h3>
              <div className="stat-icon-wrapper emerald">
                <Users size={22} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton skeleton-value" />
            ) : (
              <div className="stat-value">{stats.totalPacientes}</div>
            )}
            <div className="stat-footer">
              <span>Pacientes sob acompanhamento</span>
            </div>
          </div>

          {/* Stat Card 2: Consultas da Semana */}
          <div className="stat-card">
            <div className="stat-header">
              <h3>Consultas da Semana</h3>
              <div className="stat-icon-wrapper teal">
                <Calendar size={22} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton skeleton-value" />
            ) : (
              <div className="stat-value">{stats.consultasSemana}</div>
            )}
            <div className="stat-footer">
              <span>Agendadas para esta semana</span>
            </div>
          </div>

          {/* Stat Card 3: Pacientes sem Retorno */}
          <div className="stat-card list-card">
            <div className="stat-header">
              <h3>Pacientes sem Retorno (&gt;30d)</h3>
              <div className="stat-icon-wrapper amber">
                <Clock size={22} />
              </div>
            </div>

            {loading ? (
              <div>
                <div className="skeleton skeleton-list-item" />
                <div className="skeleton skeleton-list-item" />
              </div>
            ) : stats.pacientesSemRetorno.length > 0 ? (
              <ul className="patients-list">
                {stats.pacientesSemRetorno.map((p) => {
                  const initial = p.nome ? p.nome.charAt(0).toUpperCase() : 'P';
                  return (
                    <li key={p.id}>
                      <Link to={`/pacientes/${p.id}`} className="patient-item">
                        <div className="patient-info">
                          <div className="patient-avatar-mini">
                            {initial}
                          </div>
                          <span className="patient-name">{p.nome}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="patient-tag">Sem retorno</span>
                          <ChevronRight size={16} className="arrow" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle2 size={24} />
                </div>
                <p>Tudo em dia!</p>
                <span>Nenhum paciente sem retorno no momento.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
