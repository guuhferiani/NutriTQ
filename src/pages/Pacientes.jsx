import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSession } from '../lib/auth';
import { sql } from '../lib/db';
import { 
  Users, 
  Search, 
  Plus, 
  ChevronRight, 
  Calendar, 
  Target, 
  UserPlus, 
  AlertCircle, 
  X 
} from 'lucide-react';

export default function Pacientes() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal de Novo Paciente
  const [modalAberto, setModalAberto] = useState(false);
  const [activeTabNovo, setActiveTabNovo] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'
  const [salvando, setSalvando] = useState(false);
  const [novoPaciente, setNovoPaciente] = useState({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: 'Moderadamente ativo',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: 5,
    horario_acorda: '07:00',
    horario_dorme: '23:00',
    litros_agua: '2.5',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Carregar lista de pacientes do nutricionista
  useEffect(() => {
    async function loadPacientes() {
      if (!session?.user?.email) return;

      try {
        setLoading(true);
        setError(null);

        // Obter id do nutricionista
        const nutriResult = await sql`
          SELECT id FROM nutricionistas WHERE email = ${session.user.email} LIMIT 1
        `;

        if (nutriResult.length === 0) {
          setPacientes([]);
          return;
        }

        const nutriId = nutriResult[0].id;

        // Buscar pacientes com data da última consulta
        const pacientesResult = await sql`
          SELECT 
            p.*,
            (
              SELECT MAX(data_consulta) 
              FROM consultas 
              WHERE paciente_id = p.id
            ) as ultima_consulta_data
          FROM pacientes p
          WHERE p.nutricionista_id = ${nutriId}
          ORDER BY p.created_at DESC
        `;

        setPacientes(pacientesResult || []);
      } catch (err) {
        console.error('Erro ao buscar pacientes:', err);
        setError('Não foi possível carregar a lista de pacientes do Neon.');
      } finally {
        setLoading(false);
      }
    }

    loadPacientes();
  }, [session]);

  // Filtragem por busca
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.nome?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.whatsapp?.includes(term)
    );
  });

  // Salvar Novo Paciente
  const handleCriarPaciente = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!novoPaciente.nome?.trim()) {
      alert('Por favor, informe o nome completo do paciente na aba 1 (Pessoal).');
      setActiveTabNovo('pessoal');
      return;
    }

    setSalvando(true);
    try {
      // 1. Obter id do nutricionista
      let nutriResult = await sql`
        SELECT id FROM nutricionistas WHERE email = ${session.user.email} LIMIT 1
      `;

      let nutriId;
      if (nutriResult.length === 0) {
        // Criar registro na tabela nutricionistas se não existir
        const newNutri = await sql`
          INSERT INTO nutricionistas (id, nome, email, created_at)
          VALUES (gen_random_uuid(), ${session.user.name || 'Nutricionista'}, ${session.user.email}, NOW() AT TIME ZONE 'America/Sao_Paulo')
          RETURNING id
        `;
        nutriId = newNutri[0].id;
      } else {
        nutriId = nutriResult[0].id;
      }

      // 2. Inserir Paciente
      const res = await sql`
        INSERT INTO pacientes (
          id,
          nutricionista_id,
          nome,
          data_nascimento,
          sexo,
          whatsapp,
          email,
          peso_inicial,
          altura,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          restricoes_alimentares,
          alergias,
          medicamentos,
          suplementos,
          refeicoes_por_dia,
          horario_acorda,
          horario_dorme,
          litros_agua,
          atividade_fisica,
          atividade_fisica_descricao,
          observacoes,
          created_at
        )
        VALUES (
          gen_random_uuid(),
          ${nutriId},
          ${novoPaciente.nome},
          ${novoPaciente.data_nascimento || null},
          ${novoPaciente.sexo},
          ${novoPaciente.whatsapp},
          ${novoPaciente.email},
          ${novoPaciente.peso_inicial ? parseFloat(novoPaciente.peso_inicial) : null},
          ${novoPaciente.altura ? parseFloat(novoPaciente.altura) : null},
          ${novoPaciente.objetivos},
          ${novoPaciente.objetivo_texto},
          ${novoPaciente.nivel_atividade},
          ${novoPaciente.patologias},
          ${novoPaciente.restricoes_alimentares},
          ${novoPaciente.alergias},
          ${novoPaciente.medicamentos},
          ${novoPaciente.suplementos},
          ${novoPaciente.refeicoes_por_dia ? parseInt(novoPaciente.refeicoes_por_dia, 10) : 5},
          ${novoPaciente.horario_acorda},
          ${novoPaciente.horario_dorme},
          ${novoPaciente.litros_agua ? parseFloat(novoPaciente.litros_agua) : 2.5},
          ${novoPaciente.atividade_fisica},
          ${novoPaciente.atividade_fisica_descricao},
          ${novoPaciente.observacoes},
          NOW() AT TIME ZONE 'America/Sao_Paulo'
        )
        RETURNING *
      `;

      if (res && res.length > 0) {
        const pacienteCriado = res[0];
        setModalAberto(false);
        // Redirecionar direto para o perfil do novo paciente
        navigate(`/pacientes/${pacienteCriado.id}`);
      }
    } catch (err) {
      console.error('Erro ao cadastrar paciente no Neon:', err);
      alert('Erro ao cadastrar paciente. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  function formatarData(dataStr) {
    if (!dataStr) return 'Sem consultas ainda';
    const parts = dataStr.toString().split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
  }

  function calcularIdade(dataNasc) {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return `${idade} anos`;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div className="greeting-section">
            <h2>Gestão de Pacientes 👥</h2>
            <p>Cadastre, acompanhe prontuários e gere planos alimentares com Inteligência Artificial.</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'auto', padding: '12px 22px' }}
            onClick={() => setModalAberto(true)}
          >
            <UserPlus size={19} />
            <span>Cadastrar Novo Paciente</span>
          </button>
        </header>

        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="patients-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar paciente por nome, e-mail ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="search-clear"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="patients-count-badge">
            <strong>{pacientesFiltrados.length}</strong> pacientes encontrados
          </div>
        </div>

        {/* Patients Grid / List */}
        {loading ? (
          <div className="patients-grid">
            <div className="skeleton skeleton-list-item" style={{ height: '140px' }} />
            <div className="skeleton skeleton-list-item" style={{ height: '140px' }} />
            <div className="skeleton skeleton-list-item" style={{ height: '140px' }} />
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="empty-state-large">
            <div className="empty-state-icon">
              <Users size={32} />
            </div>
            {searchTerm ? (
              <>
                <h3>Nenhum paciente encontrado</h3>
                <p>Nenhum resultado corresponde aos termos de busca "{searchTerm}".</p>
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className="btn-secondary-plan"
                >
                  Limpar busca
                </button>
              </>
            ) : (
              <>
                <h3>Nenhum paciente cadastrado ainda</h3>
                <p>Comece adicionando seu primeiro paciente para registrar medidas e prescrever dietas com IA.</p>
                <button 
                  type="button" 
                  onClick={() => setModalAberto(true)} 
                  className="btn-primary"
                  style={{ width: 'auto', marginTop: '12px' }}
                >
                  <Plus size={18} />
                  <span>Cadastrar Primeiro Paciente</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="patients-grid">
            {pacientesFiltrados.map((p) => {
              const initial = p.nome ? p.nome.charAt(0).toUpperCase() : 'P';
              const idade = calcularIdade(p.data_nascimento);
              const objetivo = p.objetivo_texto || (Array.isArray(p.objetivos) && p.objetivos[0]) || 'Acompanhamento nutricional';

              return (
                <Link
                  key={p.id}
                  to={`/pacientes/${p.id}`}
                  className="patient-card-link"
                >
                  <div className="patient-card">
                    <div className="patient-card-top">
                      <div className="patient-avatar">
                        {initial}
                      </div>
                      <div className="patient-main-info">
                        <h4 className="patient-card-name">{p.nome}</h4>
                        <div className="patient-tags-row">
                          {idade && <span className="tag-pill">{idade}</span>}
                          {p.sexo && <span className="tag-pill">{p.sexo}</span>}
                          {p.peso_inicial && <span className="tag-pill">{p.peso_inicial} kg</span>}
                        </div>
                      </div>
                    </div>

                    <div className="patient-card-details">
                      <div className="detail-item">
                        <Target size={14} className="detail-icon" />
                        <span className="truncate-text">{objetivo}</span>
                      </div>
                      <div className="detail-item">
                        <Calendar size={14} className="detail-icon" />
                        <span>Última consulta: <strong>{formatarData(p.ultima_consulta_data)}</strong></span>
                      </div>
                    </div>

                    <div className="patient-card-footer">
                      <span className="btn-access-profile">
                        <span>Acessar Prontuário & IA</span>
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Modal de Cadastro de Novo Paciente */}
        {modalAberto && (
          <div className="modal-overlay">
            <div className="modal-container large-modal">
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <div className="brand-icon-box" style={{ width: '38px', height: '38px' }}>
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3>Cadastrar Novo Paciente</h3>
                    <p>Preencha os dados clínicos para que a IA possa gerar cardápios assertivos.</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)} 
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Subtabs do Modal */}
              <div className="subtabs-bar" style={{ margin: '0 24px 16px' }}>
                <button
                  type="button"
                  className={`subtab-btn ${activeTabNovo === 'pessoal' ? 'active' : ''}`}
                  onClick={() => setActiveTabNovo('pessoal')}
                >
                  1. Pessoal
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${activeTabNovo === 'clinico' ? 'active' : ''}`}
                  onClick={() => setActiveTabNovo('clinico')}
                >
                  2. Clínico & Metas
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${activeTabNovo === 'habitos' ? 'active' : ''}`}
                  onClick={() => setActiveTabNovo('habitos')}
                >
                  3. Hábitos & Rotina
                </button>
              </div>

              <form onSubmit={handleCriarPaciente} className="modal-form" style={{ padding: '0 24px 24px' }}>
                {activeTabNovo === 'pessoal' && (
                  <div className="form-grid-2">
                    <div className="input-group full-width">
                      <label>Nome Completo *</label>
                      <input
                        type="text"
                        value={novoPaciente.nome}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, nome: e.target.value })}
                        required
                        placeholder="Ex: Mariana Silva Costa"
                        autoFocus
                      />
                    </div>

                    <div className="input-group">
                      <label>Data de Nascimento</label>
                      <input
                        type="date"
                        value={novoPaciente.data_nascimento}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, data_nascimento: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label>Sexo</label>
                      <select
                        value={novoPaciente.sexo}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, sexo: e.target.value })}
                      >
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>WhatsApp / Telefone</label>
                      <input
                        type="text"
                        value={novoPaciente.whatsapp}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, whatsapp: e.target.value })}
                        placeholder="(11) 98765-4321"
                      />
                    </div>

                    <div className="input-group">
                      <label>E-mail</label>
                      <input
                        type="email"
                        value={novoPaciente.email}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, email: e.target.value })}
                        placeholder="mariana@email.com"
                      />
                    </div>
                  </div>
                )}

                {activeTabNovo === 'clinico' && (
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Peso Inicial (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={novoPaciente.peso_inicial}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, peso_inicial: e.target.value })}
                        placeholder="Ex: 68.0"
                      />
                    </div>

                    <div className="input-group">
                      <label>Altura (cm)</label>
                      <input
                        type="number"
                        value={novoPaciente.altura}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, altura: e.target.value })}
                        placeholder="Ex: 165"
                      />
                    </div>

                    <div className="input-group full-width">
                      <label>Objetivo Principal</label>
                      <input
                        type="text"
                        value={novoPaciente.objetivo_texto}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, objetivo_texto: e.target.value })}
                        placeholder="Ex: Emagrecimento, reeducação alimentar, controle glicêmico..."
                      />
                    </div>

                    <div className="input-group">
                      <label>Nível de Atividade</label>
                      <select
                        value={novoPaciente.nivel_atividade}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, nivel_atividade: e.target.value })}
                      >
                        <option value="Sedentário">Sedentário</option>
                        <option value="Levemente ativo">Levemente ativo</option>
                        <option value="Moderadamente ativo">Moderadamente ativo</option>
                        <option value="Muito ativo">Muito ativo</option>
                        <option value="Extremamente ativo">Extremamente ativo</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Alergias Alimentares (vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Amendoim, Camarão, Leite"
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          alergias: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                      />
                    </div>

                    <div className="input-group">
                      <label>Restrições Alimentares (vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Lactose, Glúten, Carne vermelha"
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          restricoes_alimentares: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                      />
                    </div>

                    <div className="input-group">
                      <label>Patologias / Condições</label>
                      <input
                        type="text"
                        placeholder="Ex: Hipertensão, Diabetes Tipo 2"
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          patologias: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                      />
                    </div>
                  </div>
                )}

                {activeTabNovo === 'habitos' && (
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Refeições por dia</label>
                      <input
                        type="number"
                        value={novoPaciente.refeicoes_por_dia}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, refeicoes_por_dia: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label>Litros de água por dia</label>
                      <input
                        type="number"
                        step="0.1"
                        value={novoPaciente.litros_agua}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, litros_agua: e.target.value })}
                        placeholder="2.5"
                      />
                    </div>

                    <div className="input-group">
                      <label>Horário que acorda</label>
                      <input
                        type="text"
                        value={novoPaciente.horario_acorda}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, horario_acorda: e.target.value })}
                        placeholder="07:00"
                      />
                    </div>

                    <div className="input-group">
                      <label>Horário que dorme</label>
                      <input
                        type="text"
                        value={novoPaciente.horario_dorme}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, horario_dorme: e.target.value })}
                        placeholder="23:00"
                      />
                    </div>

                    <div className="input-group full-width">
                      <label>Atividade Física</label>
                      <input
                        type="text"
                        value={novoPaciente.atividade_fisica_descricao}
                        onChange={(e) => setNovoPaciente({
                          ...novoPaciente,
                          atividade_fisica_descricao: e.target.value,
                          atividade_fisica: !!e.target.value
                        })}
                        placeholder="Ex: Musculação 3x/semana + Pilates 2x"
                      />
                    </div>

                    <div className="input-group full-width">
                      <label>Observações Adicionais</label>
                      <textarea
                        rows={2}
                        value={novoPaciente.observacoes}
                        onChange={(e) => setNovoPaciente({ ...novoPaciente, observacoes: e.target.value })}
                        placeholder="Gostos culinários, aversões ou rotina de trabalho..."
                      />
                    </div>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  {activeTabNovo === 'clinico' && (
                    <button
                      key="prev-clinico"
                      type="button"
                      className="btn-secondary-plan"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTabNovo('pessoal');
                      }}
                    >
                      ← Voltar para Pessoal
                    </button>
                  )}

                  {activeTabNovo === 'habitos' && (
                    <button
                      key="prev-habitos"
                      type="button"
                      className="btn-secondary-plan"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTabNovo('clinico');
                      }}
                    >
                      ← Voltar para Clínico
                    </button>
                  )}

                  {activeTabNovo === 'pessoal' && (
                    <button
                      key="next-pessoal"
                      type="button"
                      className="btn-primary"
                      style={{ width: 'auto' }}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!novoPaciente.nome?.trim()) {
                          alert('Por favor, preencha o Nome Completo do paciente.');
                          return;
                        }
                        setActiveTabNovo('clinico');
                      }}
                    >
                      Avançar para Clínico & Metas →
                    </button>
                  )}

                  {activeTabNovo === 'clinico' && (
                    <button
                      key="next-clinico"
                      type="button"
                      className="btn-primary"
                      style={{ width: 'auto' }}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTabNovo('habitos');
                      }}
                    >
                      Avançar para Hábitos & Rotina →
                    </button>
                  )}

                  {activeTabNovo === 'habitos' && (
                    <button
                      key="submit-habitos"
                      type="button"
                      className="btn-primary"
                      disabled={salvando}
                      style={{ width: 'auto' }}
                      onClick={handleCriarPaciente}
                    >
                      {salvando ? 'Salvando no Neon...' : 'Finalizar e Salvar Paciente'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
