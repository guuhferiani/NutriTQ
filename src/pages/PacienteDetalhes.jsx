import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GeradorPlanoIA from '../components/GeradorPlanoIA';
import { sql } from '../lib/db';
import {
  ArrowLeft,
  User,
  Utensils,
  Calendar,
  Save,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Mail,
  Loader2,
  Phone,
  Scale,
  X
} from 'lucide-react';

export default function PacienteDetalhes() {
  const { id } = useParams();

  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('planos'); // 'dados' | 'consultas' | 'planos'
  const [activeDadosTab, setActiveDadosTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'

  // Estado de edição dos dados do paciente
  const [formData, setFormData] = useState({});
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [msgSucessoDados, setMsgSucessoDados] = useState(false);

  // Modal de Nova Consulta
  const [modalConsultaAberto, setModalConsultaAberto] = useState(false);
  const [novaConsulta, setNovaConsulta] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });
  const [salvandoConsulta, setSalvandoConsulta] = useState(false);

  // Carregar dados completos do paciente e consultas
  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        // 1. Buscar Paciente
        const pacienteResult = await sql`
          SELECT * FROM pacientes WHERE id = ${id} LIMIT 1
        `;

        if (pacienteResult.length === 0) {
          setError('Paciente não encontrado.');
          return;
        }

        const p = pacienteResult[0];
        setPaciente(p);
        setFormData({
          nome: p.nome || '',
          data_nascimento: p.data_nascimento ? p.data_nascimento.toString().split('T')[0] : '',
          sexo: p.sexo || 'Feminino',
          whatsapp: p.whatsapp || '',
          email: p.email || '',
          peso_inicial: p.peso_inicial || '',
          altura: p.altura || '',
          objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
          objetivo_texto: p.objetivo_texto || '',
          nivel_atividade: p.nivel_atividade || 'Moderadamente ativo',
          patologias: Array.isArray(p.patologias) ? p.patologias : [],
          restricoes_alimentares: Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : [],
          alergias: Array.isArray(p.alergias) ? p.alergias : [],
          medicamentos: p.medicamentos || '',
          suplementos: p.suplementos || '',
          refeicoes_por_dia: p.refeicoes_por_dia || 5,
          horario_acorda: p.horario_acorda || '07:00',
          horario_dorme: p.horario_dorme || '23:00',
          litros_agua: p.litros_agua || 2.5,
          atividade_fisica: p.atividade_fisica || false,
          atividade_fisica_descricao: p.atividade_fisica_descricao || '',
          observacoes: p.observacoes || ''
        });

        // 2. Buscar Consultas
        const consultasResult = await sql`
          SELECT * FROM consultas WHERE paciente_id = ${id} ORDER BY data_consulta DESC
        `;
        setConsultas(consultasResult || []);
      } catch (err) {
        console.error('Erro ao carregar dados do paciente:', err);
        setError('Não foi possível conectar ao banco de dados Neon.');
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [id]);

  // Cálculos rápidos
  const pesoAtual = consultas.length > 0 ? consultas[0].peso : formData.peso_inicial || paciente?.peso_inicial;
  const alturaEmMetros = formData.altura ? parseFloat(formData.altura) / 100 : (paciente?.altura ? parseFloat(paciente.altura) / 100 : 0);
  const imc = pesoAtual && alturaEmMetros > 0 
    ? (parseFloat(pesoAtual) / (alturaEmMetros * alturaEmMetros)).toFixed(1) 
    : '-';

  // Salvar alterações nos Dados do Paciente
  const handleSalvarDadosPaciente = async (e) => {
    e.preventDefault();
    setSalvandoDados(true);
    setMsgSucessoDados(false);

    try {
      await sql`
        UPDATE pacientes
        SET 
          nome = ${formData.nome},
          data_nascimento = ${formData.data_nascimento || null},
          sexo = ${formData.sexo},
          whatsapp = ${formData.whatsapp},
          email = ${formData.email},
          peso_inicial = ${formData.peso_inicial ? parseFloat(formData.peso_inicial) : null},
          altura = ${formData.altura ? parseFloat(formData.altura) : null},
          objetivos = ${formData.objetivos},
          objetivo_texto = ${formData.objetivo_texto},
          nivel_atividade = ${formData.nivel_atividade},
          patologias = ${formData.patologias},
          restricoes_alimentares = ${formData.restricoes_alimentares},
          alergias = ${formData.alergias},
          medicamentos = ${formData.medicamentos},
          suplementos = ${formData.suplementos},
          refeicoes_por_dia = ${formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : 5},
          horario_acorda = ${formData.horario_acorda},
          horario_dorme = ${formData.horario_dorme},
          litros_agua = ${formData.litros_agua ? parseFloat(formData.litros_agua) : 2.5},
          atividade_fisica = ${formData.atividade_fisica},
          atividade_fisica_descricao = ${formData.atividade_fisica_descricao},
          observacoes = ${formData.observacoes}
        WHERE id = ${id}
      `;

      setPaciente({ ...paciente, ...formData });
      setMsgSucessoDados(true);
      setTimeout(() => setMsgSucessoDados(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar alterações:', err);
      alert('Erro ao salvar alterações no Neon. Verifique a conexão.');
    } finally {
      setSalvandoDados(false);
    }
  };

  // Salvar Nova Consulta
  const handleSalvarConsulta = async (e) => {
    e.preventDefault();
    setSalvandoConsulta(true);

    try {
      const res = await sql`
        INSERT INTO consultas (
          id, 
          paciente_id, 
          data_consulta, 
          peso, 
          cintura, 
          quadril, 
          percentual_gordura, 
          observacoes, 
          proximo_retorno, 
          created_at
        )
        VALUES (
          gen_random_uuid(),
          ${id},
          ${novaConsulta.data_consulta},
          ${novaConsulta.peso ? parseFloat(novaConsulta.peso) : null},
          ${novaConsulta.cintura ? parseFloat(novaConsulta.cintura) : null},
          ${novaConsulta.quadril ? parseFloat(novaConsulta.quadril) : null},
          ${novaConsulta.percentual_gordura ? parseFloat(novaConsulta.percentual_gordura) : null},
          ${novaConsulta.observacoes},
          ${novaConsulta.proximo_retorno || null},
          NOW() AT TIME ZONE 'America/Sao_Paulo'
        )
        RETURNING *
      `;

      if (res.length > 0) {
        setConsultas([res[0], ...consultas]);
        setModalConsultaAberto(false);
        setNovaConsulta({
          data_consulta: new Date().toISOString().split('T')[0],
          peso: '',
          cintura: '',
          quadril: '',
          percentual_gordura: '',
          observacoes: '',
          proximo_retorno: ''
        });
      }
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      alert('Erro ao salvar consulta.');
    } finally {
      setSalvandoConsulta(false);
    }
  };

  function calcularIdade(dataNasc) {
    if (!dataNasc) return '-';
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return `${idade} anos`;
  }

  function formatarDataSimples(dataStr) {
    if (!dataStr) return '-';
    const parts = dataStr.toString().split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
  }

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--slate-500)' }}>
            <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
            <p>Carregando prontuário do paciente...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="error-message" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <AlertCircle size={20} />
            <span>{error || 'Paciente não encontrado.'}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/pacientes" className="btn-secondary-plan" style={{ display: 'inline-flex' }}>
              <ArrowLeft size={16} />
              <span>Voltar para Lista de Pacientes</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Navigation & Header */}
        <div className="patient-detail-header">
          <Link to="/pacientes" className="btn-back">
            <ArrowLeft size={18} />
            <span>Pacientes</span>
          </Link>

          <div className="patient-hero-card">
            <div className="patient-hero-main">
              <div className="patient-avatar-large">
                {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="patient-hero-info">
                <div className="patient-hero-name-row">
                  <h2>{paciente.nome}</h2>
                  <span className="patient-status-badge">Ativo</span>
                </div>
                <div className="patient-quick-metrics">
                  <span><strong>Idade:</strong> {calcularIdade(paciente.data_nascimento)}</span>
                  <span>•</span>
                  <span><strong>Peso:</strong> {pesoAtual ? `${pesoAtual} kg` : '-'}</span>
                  <span>•</span>
                  <span><strong>Altura:</strong> {paciente.altura ? `${paciente.altura} cm` : '-'}</span>
                  <span>•</span>
                  <span><strong>IMC:</strong> {imc}</span>
                </div>
              </div>
            </div>

            <div className="patient-hero-contacts">
              {paciente.whatsapp && (
                <div className="contact-chip">
                  <Phone size={14} />
                  <span>{paciente.whatsapp}</span>
                </div>
              )}
              {paciente.email && (
                <div className="contact-chip">
                  <Mail size={14} />
                  <span>{paciente.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Main Tabs Navigation */}
        <div className="patient-main-tabs">
          <button
            type="button"
            className={`main-tab-item ${activeMainTab === 'planos' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('planos')}
          >
            <Utensils size={18} />
            <span>Planos Alimentares (IA)</span>
          </button>

          <button
            type="button"
            className={`main-tab-item ${activeMainTab === 'consultas' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('consultas')}
          >
            <Calendar size={18} />
            <span>Consultas & Antropometria</span>
          </button>

          <button
            type="button"
            className={`main-tab-item ${activeMainTab === 'dados' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('dados')}
          >
            <User size={18} />
            <span>Dados do Paciente</span>
          </button>
        </div>

        {/* Section 1: Planos Alimentares (Core Feature Prompt 6) */}
        {activeMainTab === 'planos' && (
          <GeradorPlanoIA 
            paciente={paciente} 
          />
        )}

        {/* Section 2: Consultas & Evolução */}
        {activeMainTab === 'consultas' && (
          <div className="consultas-section">
            <div className="section-header-row">
              <div>
                <h3>Histórico de Consultas & Evolução de Peso</h3>
                <p>Acompanhe medidas corporais e evolução ponderal ao longo dos atendimentos.</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setModalConsultaAberto(true)}
              >
                <Plus size={18} />
                <span>Nova Consulta</span>
              </button>
            </div>

            {/* Gráfico de Evolução de Peso */}
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                  <h4>Evolução de Peso (kg)</h4>
                </div>
                <span className="chart-subtitle">
                  {consultas.length} registros cronológicos
                </span>
              </div>

              {consultas.length > 0 ? (
                <div className="weight-chart-wrapper">
                  <svg className="weight-chart-svg" viewBox="0 0 700 180">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Linha e Pontos de Evolução */}
                    {(() => {
                      const dadosOrdenados = [...consultas].sort((a, b) => new Date(a.data_consulta) - new Date(b.data_consulta));
                      const pesos = dadosOrdenados.map(c => parseFloat(c.peso || 0)).filter(p => p > 0);
                      if (pesos.length === 0) return null;

                      const minPeso = Math.min(...pesos) - 2;
                      const maxPeso = Math.max(...pesos) + 2;
                      const range = maxPeso - minPeso || 1;

                      const points = dadosOrdenados.map((c, i) => {
                        const x = dadosOrdenados.length === 1 ? 350 : 50 + (i * (600 / (dadosOrdenados.length - 1)));
                        const y = 140 - (((parseFloat(c.peso) - minPeso) / range) * 100);
                        return { x, y, consulta: c };
                      });

                      const pointsPath = points.map(p => `${p.x},${p.y}`).join(' ');

                      return (
                        <g>
                          {/* Grade horizontal */}
                          <line x1="40" y1="140" x2="660" y2="140" stroke="#E2E8F0" strokeDasharray="4" />
                          <line x1="40" y1="90" x2="660" y2="90" stroke="#E2E8F0" strokeDasharray="4" />
                          <line x1="40" y1="40" x2="660" y2="40" stroke="#E2E8F0" strokeDasharray="4" />

                          {/* Linha principal */}
                          {points.length > 1 && (
                            <polyline
                              fill="none"
                              stroke="#10B981"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={pointsPath}
                            />
                          )}

                          {/* Pontos com dados */}
                          {points.map((pt, idx) => (
                            <g key={idx}>
                              <circle cx={pt.x} cy={pt.y} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                              <text x={pt.x} y={pt.y - 12} textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="700">
                                {pt.consulta.peso} kg
                              </text>
                              <text x={pt.x} y="165" textAnchor="middle" fill="#64748B" fontSize="10">
                                {formatarDataSimples(pt.consulta.data_consulta)}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="empty-chart-box">
                  <Scale size={28} />
                  <p>Nenhuma consulta registrada ainda</p>
                  <span>Clique em "+ Nova Consulta" para registrar o primeiro atendimento e medidas.</span>
                </div>
              )}
            </div>

            {/* Tabela / Lista de Consultas */}
            <div className="consultas-list-card">
              <h4>Histórico de Atendimentos</h4>
              {consultas.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <p>Nenhum registro de consulta encontrado.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Peso</th>
                        <th>Cintura</th>
                        <th>Quadril</th>
                        <th>% Gordura</th>
                        <th>Próximo Retorno</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultas.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{formatarDataSimples(c.data_consulta)}</td>
                          <td>{c.peso ? `${c.peso} kg` : '-'}</td>
                          <td>{c.cintura ? `${c.cintura} cm` : '-'}</td>
                          <td>{c.quadril ? `${c.quadril} cm` : '-'}</td>
                          <td>{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</td>
                          <td>{c.proximo_retorno ? formatarDataSimples(c.proximo_retorno) : 'Não agendado'}</td>
                          <td className="truncate-text" title={c.observacoes}>{c.observacoes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Dados do Paciente (Abas Pessoal, Clínico, Hábitos) */}
        {activeMainTab === 'dados' && (
          <div className="dados-paciente-section">
            <div className="subtabs-bar">
              <button
                type="button"
                className={`subtab-btn ${activeDadosTab === 'pessoal' ? 'active' : ''}`}
                onClick={() => setActiveDadosTab('pessoal')}
              >
                1. Pessoal
              </button>
              <button
                type="button"
                className={`subtab-btn ${activeDadosTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveDadosTab('clinico')}
              >
                2. Clínico & Metas
              </button>
              <button
                type="button"
                className={`subtab-btn ${activeDadosTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveDadosTab('habitos')}
              >
                3. Hábitos & Rotina
              </button>
            </div>

            {msgSucessoDados && (
              <div className="success-banner">
                <CheckCircle2 size={18} />
                <span>Dados do paciente atualizados com sucesso no Neon!</span>
              </div>
            )}

            <form onSubmit={handleSalvarDadosPaciente} className="dados-form-wrapper">
              {/* Aba Pessoal */}
              {activeDadosTab === 'pessoal' && (
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label>Sexo</label>
                    <select
                      value={formData.sexo}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
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
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="paciente@email.com"
                    />
                  </div>
                </div>
              )}

              {/* Aba Clínico */}
              {activeDadosTab === 'clinico' && (
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Peso Inicial (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.peso_inicial}
                      onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                      placeholder="Ex: 72.5"
                    />
                  </div>

                  <div className="input-group">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      value={formData.altura}
                      onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                      placeholder="Ex: 170"
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>Objetivo Principal</label>
                    <input
                      type="text"
                      value={formData.objetivo_texto}
                      onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                      placeholder="Ex: Emagrecimento saudável, redução de gordura visceral e melhora de energia"
                    />
                  </div>

                  <div className="input-group">
                    <label>Nível de Atividade Física</label>
                    <select
                      value={formData.nivel_atividade}
                      onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                    >
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Alergias Alimentares (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.alergias) ? formData.alergias.join(', ') : formData.alergias}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        alergias: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="Ex: Amendoim, Leite, Frutos do mar"
                    />
                  </div>

                  <div className="input-group">
                    <label>Restrições Alimentares (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.restricoes_alimentares) ? formData.restricoes_alimentares.join(', ') : formData.restricoes_alimentares}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        restricoes_alimentares: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="Ex: Lactose, Glúten, Carne vermelha"
                    />
                  </div>

                  <div className="input-group">
                    <label>Patologias / Condições de Saúde</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.patologias) ? formData.patologias.join(', ') : formData.patologias}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        patologias: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="Ex: Diabetes Tipo 2, Hipertensão, Hipotireoidismo"
                    />
                  </div>

                  <div className="input-group">
                    <label>Medicamentos Contínuos</label>
                    <input
                      type="text"
                      value={formData.medicamentos}
                      onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                      placeholder="Ex: Levotiroxina 50mcg"
                    />
                  </div>

                  <div className="input-group">
                    <label>Suplementos em Uso</label>
                    <input
                      type="text"
                      value={formData.suplementos}
                      onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                      placeholder="Ex: Creatina 5g, Vitamina D"
                    />
                  </div>
                </div>
              )}

              {/* Aba Hábitos */}
              {activeDadosTab === 'habitos' && (
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Refeições por dia</label>
                    <input
                      type="number"
                      value={formData.refeicoes_por_dia}
                      onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label>Consumo diário de água (Litros)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.litros_agua}
                      onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                      placeholder="Ex: 2.5"
                    />
                  </div>

                  <div className="input-group">
                    <label>Horário que Acorda</label>
                    <input
                      type="text"
                      value={formData.horario_acorda}
                      onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                      placeholder="06:30"
                    />
                  </div>

                  <div className="input-group">
                    <label>Horário que Dorme</label>
                    <input
                      type="text"
                      value={formData.horario_dorme}
                      onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                      placeholder="23:00"
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>Descrição da Atividade Física</label>
                    <input
                      type="text"
                      value={formData.atividade_fisica_descricao}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        atividade_fisica_descricao: e.target.value,
                        atividade_fisica: !!e.target.value
                      })}
                      placeholder="Ex: Musculação 4x na semana + Corrida leve aos sábados"
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>Observações Gerais e Preferências</label>
                    <textarea
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Preferências culinárias, aversões ou rotina de trabalho..."
                    />
                  </div>
                </div>
              )}

              <div className="form-action-footer">
                <button type="submit" className="btn-primary" disabled={salvandoDados} style={{ width: 'auto' }}>
                  <Save size={18} />
                  <span>{salvandoDados ? 'Salvando...' : 'Salvar alterações no Neon'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal de Nova Consulta */}
        {modalConsultaAberto && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Registrar Nova Consulta</h3>
                <button 
                  type="button" 
                  onClick={() => setModalConsultaAberto(false)} 
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSalvarConsulta} className="modal-form">
                <div className="input-group">
                  <label>Data da Consulta *</label>
                  <input
                    type="date"
                    value={novaConsulta.data_consulta}
                    onChange={(e) => setNovaConsulta({ ...novaConsulta, data_consulta: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-3">
                  <div className="input-group">
                    <label>Peso (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaConsulta.peso}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, peso: e.target.value })}
                      required
                      placeholder="70.5"
                    />
                  </div>

                  <div className="input-group">
                    <label>Cintura (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaConsulta.cintura}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, cintura: e.target.value })}
                      placeholder="82.0"
                    />
                  </div>

                  <div className="input-group">
                    <label>Quadril (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaConsulta.quadril}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, quadril: e.target.value })}
                      placeholder="101.5"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label>% de Gordura Corporal</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaConsulta.percentual_gordura}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, percentual_gordura: e.target.value })}
                      placeholder="18.5"
                    />
                  </div>

                  <div className="input-group">
                    <label>Próximo Retorno</label>
                    <input
                      type="date"
                      value={novaConsulta.proximo_retorno}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, proximo_retorno: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Observações Clínicas da Consulta</label>
                  <textarea
                    rows={3}
                    value={novaConsulta.observacoes}
                    onChange={(e) => setNovaConsulta({ ...novaConsulta, observacoes: e.target.value })}
                    placeholder="Evolução percebida, adesão ao plano anterior, ajustes solicitados..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setModalConsultaAberto(false)}
                    className="btn-secondary-plan"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={salvandoConsulta}
                    style={{ width: 'auto' }}
                  >
                    {salvandoConsulta ? 'Salvando...' : 'Salvar Consulta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
