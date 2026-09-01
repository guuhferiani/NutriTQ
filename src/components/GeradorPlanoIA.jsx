import { useState, useEffect } from 'react';
import { sql } from '../lib/db';
import { 
  Sparkles, 
  Save, 
  PlusCircle, 
  Calendar, 
  Clock, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  Printer, 
  X, 
  Coffee, 
  Apple, 
  SunMedium, 
  Cookie, 
  Moon,
  Info
} from 'lucide-react';

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

const REFEICOES_CONFIG = [
  { key: 'cafe_da_manha', label: 'Café da Manhã', icon: Coffee, color: '#F59E0B' },
  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: Apple, color: '#10B981' },
  { key: 'almoco', label: 'Almoço', icon: SunMedium, color: '#0D9488' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: Cookie, color: '#6366F1' },
  { key: 'jantar', label: 'Jantar', icon: Moon, color: '#8B5CF6' }
];

const MENSAGENS_LOADING = [
  'Lendo perfil e histórico do paciente...',
  'Analisando restrições, alergias e preferências...',
  'IA calculando combinações nutricionais brasileiras...',
  'Montando opções variadas para cada refeição...',
  'Equilibrando macronutrientes da semana...',
  'Finalizando e estruturando cardápio completo...'
];

export default function GeradorPlanoIA({ paciente, onPlanoSalvo }) {
  const [loadingIA, setLoadingIA] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [historicoPlanos, setHistoricoPlanos] = useState([]);
  
  // Estado do plano alimentar em edição
  const [planoSemanal, setPlanoSemanal] = useState(null);
  const [diaAtivo, setDiaAtivo] = useState('Segunda-feira');
  const [planoOriginalId, setPlanoOriginalId] = useState(null);
  
  // Toasts / Feedback
  const [toast, setToast] = useState(null);

  const showToast = (mensagem, tipo = 'success') => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  // Carregar histórico de planos do paciente no Neon
  useEffect(() => {
    async function fetchHistorico() {
      if (!paciente?.id) return;
      try {
        setCarregandoHistorico(true);
        const res = await sql`
          SELECT id, paciente_id, conteudo, created_at
          FROM planos_alimentares
          WHERE paciente_id = ${paciente.id}
          ORDER BY created_at DESC
        `;
        setHistoricoPlanos(res || []);
      } catch (err) {
        console.error('Erro ao carregar histórico de planos:', err);
      } finally {
        setCarregandoHistorico(false);
      }
    }

    fetchHistorico();
  }, [paciente?.id]);

  // Mensagens rotativas durante o loading da IA
  useEffect(() => {
    let interval;
    if (loadingIA) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % MENSAGENS_LOADING.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loadingIA]);

  // Estrutura inicial para plano manual
  const criarPlanoEmBranco = () => {
    return DIAS_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', '']
      }
    }));
  };

  // 1. Gerar Plano com IA
  const handleGerarComIA = async () => {
    setLoadingIA(true);
    try {
      // Prepara os dados do paciente para enviar à API
      const dadosParaEnvio = {
        nome: paciente.nome,
        idade: paciente.idade || (paciente.data_nascimento ? calcularIdade(paciente.data_nascimento) : 'Não informada'),
        sexo: paciente.sexo || 'Não informado',
        peso_atual: paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado',
        altura: paciente.altura ? `${paciente.altura} cm` : 'Não informada',
        objetivos: paciente.objetivos || [],
        objetivo_texto: paciente.objetivo_texto || '',
        nivel_atividade: paciente.nivel_atividade || 'Não informado',
        patologias: paciente.patologias || [],
        restricoes_alimentares: paciente.restricoes_alimentares || [],
        alergias: paciente.alergias || [],
        medicamentos: paciente.medicamentos || 'Nenhum',
        suplementos: paciente.suplementos || 'Nenhum',
        refeicoes_por_dia: paciente.refeicoes_por_dia || 5,
        horario_acorda: paciente.horario_acorda || '07:00',
        horario_dorme: paciente.horario_dorme || '23:00',
        litros_agua: paciente.litros_agua ? `${paciente.litros_agua}L` : 'Não informado',
        atividade_fisica: paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || 'Regular'})` : 'Não',
        observacoes: paciente.observacoes || 'Nenhuma'
      };

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paciente: dadosParaEnvio,
          dados_do_paciente: dadosParaEnvio
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha na resposta do servidor.');
      }

      const data = await response.json();
      
      if (!data.success || !data.plano || !data.plano.plano_semanal) {
        throw new Error('Formato de resposta inválido retornado pela IA.');
      }

      // Preenche os dias que vierem com garantia de 5 opções por refeição
      const planoFormatado = padronizarPlano(data.plano.plano_semanal);
      setPlanoSemanal(planoFormatado);
      setPlanoOriginalId(null);
      setDiaAtivo(planoFormatado[0]?.dia || 'Segunda-feira');
      
      showToast('Plano alimentar semanal gerado com IA com sucesso! Revise e edite abaixo antes de salvar.', 'success');
    } catch (err) {
      console.error('Erro ao gerar plano alimentar:', err);
      showToast(
        'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        'error'
      );
    } finally {
      setLoadingIA(false);
    }
  };

  // Iniciar plano manual caso a IA falhe ou nutricionista prefira
  const handleIniciarManual = () => {
    const novoPlano = criarPlanoEmBranco();
    setPlanoSemanal(novoPlano);
    setPlanoOriginalId(null);
    setDiaAtivo('Segunda-feira');
    showToast('Modo de criação manual iniciado. Preencha os cardápios de cada dia.', 'info');
  };

  // Garante que todo dia tenha 5 refeições e cada refeição tenha exatamente 5 opções
  const padronizarPlano = (diasArray) => {
    return DIAS_SEMANA.map((nomeDia) => {
      const diaEncontrado = diasArray.find(
        (d) => d.dia?.toLowerCase().trim() === nomeDia.toLowerCase().trim()
      ) || diasArray[0] || {};

      const refeicoesPadrao = {};
      REFEICOES_CONFIG.forEach(({ key }) => {
        const opcoesRecebidas = diaEncontrado.refeicoes?.[key] || [];
        const opcoesFormatadas = Array.isArray(opcoesRecebidas) 
          ? [...opcoesRecebidas] 
          : [String(opcoesRecebidas)];
        
        // Garantir array de 5 strings
        while (opcoesFormatadas.length < 5) {
          opcoesFormatadas.push('');
        }
        refeicoesPadrao[key] = opcoesFormatadas.slice(0, 5);
      });

      return {
        dia: nomeDia,
        refeicoes: refeicoesPadrao
      };
    });
  };

  // Modificar uma opção específica de refeição
  const handleOpcaoChange = (diaNome, refeicaoKey, opcaoIndex, novoValor) => {
    setPlanoSemanal((prevPlano) => {
      if (!prevPlano) return prevPlano;
      return prevPlano.map((d) => {
        if (d.dia !== diaNome) return d;
        const opcoesAtuais = [...(d.refeicoes[refeicaoKey] || ['', '', '', '', ''])];
        opcoesAtuais[opcaoIndex] = novoValor;
        return {
          ...d,
          refeicoes: {
            ...d.refeicoes,
            [refeicaoKey]: opcoesAtuais
          }
        };
      });
    });
  };

  // 2. Salvar Plano no Banco Neon
  const handleSalvarPlano = async () => {
    if (!planoSemanal || !paciente?.id) return;

    setSalvando(true);
    try {
      const conteudoJson = {
        plano_semanal: planoSemanal,
        gerado_com_ia: !planoOriginalId,
        data_salvamento: new Date().toISOString()
      };

      const resultado = await sql`
        INSERT INTO planos_alimentares (id, paciente_id, conteudo, created_at)
        VALUES (gen_random_uuid(), ${paciente.id}, ${JSON.stringify(conteudoJson)}, NOW() AT TIME ZONE 'America/Sao_Paulo')
        RETURNING id, paciente_id, conteudo, created_at
      `;

      if (resultado && resultado.length > 0) {
        const novoRegistro = resultado[0];
        setHistoricoPlanos((prev) => [novoRegistro, ...prev]);
        setPlanoOriginalId(novoRegistro.id);
        showToast('Plano alimentar salvo com sucesso no prontuário do paciente!', 'success');
        if (onPlanoSalvo) onPlanoSalvo(novoRegistro);
      }
    } catch (err) {
      console.error('Erro ao salvar plano alimentar no Neon:', err);
      showToast('Erro ao salvar o plano no banco de dados. Tente novamente.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  // Carregar plano salvo do histórico na tela de edição
  const handleCarregarPlanoDoHistorico = (itemHistorico) => {
    try {
      const conteudo = typeof itemHistorico.conteudo === 'string' 
        ? JSON.parse(itemHistorico.conteudo) 
        : itemHistorico.conteudo;

      if (conteudo?.plano_semanal) {
        const planoFormatado = padronizarPlano(conteudo.plano_semanal);
        setPlanoSemanal(planoFormatado);
        setPlanoOriginalId(itemHistorico.id);
        setDiaAtivo(planoFormatado[0]?.dia || 'Segunda-feira');
        showToast(`Plano de ${formatarData(itemHistorico.created_at)} carregado para visualização/edição.`, 'info');
      }
    } catch (e) {
      console.error('Erro ao carregar plano:', e);
      showToast('Não foi possível ler o plano alimentar selecionado.', 'error');
    }
  };

  // Função auxiliar de idade
  function calcularIdade(dataNasc) {
    if (!dataNasc) return '';
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return `${idade} anos`;
  }

  function formatarData(dataIso) {
    if (!dataIso) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dataIso));
  }

  // Dia ativo atual
  const dadosDiaAtivo = planoSemanal?.find((d) => d.dia === diaAtivo) || planoSemanal?.[0];

  return (
    <div className="meal-plan-section">
      {/* Toast Alert Notification */}
      {toast && (
        <div className={`toast-notification ${toast.tipo}`}>
          <div className="toast-content">
            {toast.tipo === 'success' && <CheckCircle2 size={18} />}
            {toast.tipo === 'error' && <AlertCircle size={18} />}
            {toast.tipo === 'info' && <Info size={18} />}
            <span>{toast.mensagem}</span>
          </div>
          {toast.tipo === 'error' && (
            <div className="toast-actions">
              <button 
                type="button" 
                onClick={handleGerarComIA}
                className="btn-toast-retry"
              >
                Tentar IA Novamente
              </button>
              <button 
                type="button" 
                onClick={handleIniciarManual}
                className="btn-toast-manual"
              >
                Criar Manual
              </button>
            </div>
          )}
          <button 
            onClick={() => setToast(null)} 
            className="toast-close"
            aria-label="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Banner / Actions Bar */}
      <div className="plan-actions-header">
        <div className="plan-title-block">
          <div className="plan-icon-badge">
            <Utensils size={22} />
          </div>
          <div>
            <h3 className="plan-section-heading">Prescrição e Planos Alimentares</h3>
            <p className="plan-section-sub">
              Gere cardápios semanais personalizados com Inteligência Artificial ou elabore manualmente.
            </p>
          </div>
        </div>

        <div className="plan-buttons-group">
          <button
            type="button"
            onClick={handleIniciarManual}
            className="btn-secondary-plan"
            disabled={loadingIA || salvando}
          >
            <PlusCircle size={17} />
            <span>Criar Plano Manual</span>
          </button>

          <button
            type="button"
            onClick={handleGerarComIA}
            disabled={loadingIA || salvando}
            className="btn-ai-generate"
          >
            <Sparkles size={18} className={loadingIA ? 'sparkle-spin' : ''} />
            <span>{loadingIA ? 'Gerando Cardápio...' : '✨ Gerar Plano com IA'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Loading State Visual */}
      {loadingIA && (
        <div className="ai-loading-box">
          <div className="ai-pulse-orb">
            <Sparkles size={32} />
          </div>
          <h4>Inteligência Artificial NutriTQ em Ação</h4>
          <p className="ai-loading-message">
            {MENSAGENS_LOADING[loadingMessageIndex]}
          </p>
          <div className="ai-progress-bar">
            <div className="ai-progress-indeterminate" />
          </div>
          <span className="ai-loading-hint">
            Personalizando 5 opções para cada refeição de Segunda a Domingo...
          </span>
        </div>
      )}

      {/* Interface de Edição de Plano em Abas */}
      {planoSemanal && !loadingIA && (
        <div className="plan-editor-card">
          <div className="editor-top-bar">
            <div className="editor-status">
              <span className="badge-editing">
                {planoOriginalId ? 'Visualizando / Editando Plano Salvo' : '✨ Novo Plano Gerado com IA'}
              </span>
              <span className="editor-tip">
                Você pode editar qualquer um dos textos antes de salvar.
              </span>
            </div>

            <div className="editor-controls">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-tool"
                title="Imprimir cardápio"
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleSalvarPlano}
                disabled={salvando}
                className="btn-save-plan"
              >
                <Save size={18} />
                <span>{salvando ? 'Salvando no Banco...' : 'Salvar Plano Alimentar'}</span>
              </button>
            </div>
          </div>

          {/* Abas dos Dias da Semana */}
          <div className="days-tabs-nav">
            {DIAS_SEMANA.map((dia) => {
              const isAtivo = dia === diaAtivo;
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setDiaAtivo(dia)}
                  className={`day-tab-btn ${isAtivo ? 'active' : ''}`}
                >
                  <Calendar size={15} />
                  <span>{dia}</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo do Dia Ativo: 5 Blocos de Refeição */}
          <div className="meals-grid-container">
            <div className="active-day-title">
              <h4>Cardápio de {diaAtivo}</h4>
              <span>Preencha ou ajuste até 5 opções nutritivas para cada momento do dia:</span>
            </div>

            <div className="meals-cards-list">
              {REFEICOES_CONFIG.map(({ key, label, icon: MealIcon, color }) => {
                const opcoes = dadosDiaAtivo?.refeicoes?.[key] || ['', '', '', '', ''];

                return (
                  <div key={key} className="meal-card">
                    <div className="meal-card-header" style={{ borderLeftColor: color }}>
                      <div className="meal-card-title">
                        <div className="meal-icon-wrapper" style={{ color: color, backgroundColor: `${color}15` }}>
                          <MealIcon size={18} />
                        </div>
                        <h5>{label}</h5>
                      </div>
                      <span className="meal-badge-count">5 Opções</span>
                    </div>

                    <div className="meal-options-inputs">
                      {opcoes.map((opcaoTexto, optIdx) => (
                        <div key={optIdx} className="meal-option-row">
                          <span className="option-number-tag">Opção {optIdx + 1}</span>
                          <input
                            type="text"
                            value={opcaoTexto}
                            onChange={(e) => handleOpcaoChange(diaAtivo, key, optIdx, e.target.value)}
                            placeholder={`Ex: Opção ${optIdx + 1} para ${label.toLowerCase()}...`}
                            className="meal-input-field"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Reminder */}
            <div className="editor-footer-save">
              <div className="editor-footer-info">
                <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
                <span>Cardápio customizado pronto para registro no histórico deste paciente.</span>
              </div>
              <button
                type="button"
                onClick={handleSalvarPlano}
                disabled={salvando}
                className="btn-save-plan"
              >
                <Save size={18} />
                <span>{salvando ? 'Salvando no Banco...' : 'Salvar Plano Alimentar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Planos Alimentares Salvos */}
      <div className="history-plans-section">
        <div className="history-header">
          <div className="history-title-group">
            <Clock size={19} className="history-icon" />
            <h4>Histórico de Planos do Paciente</h4>
          </div>
          <span className="history-count-badge">
            {historicoPlanos.length} {historicoPlanos.length === 1 ? 'plano salvo' : 'planos salvos'}
          </span>
        </div>

        {carregandoHistorico ? (
          <div className="history-loading-skeleton">
            <div className="skeleton skeleton-list-item" style={{ height: '70px' }} />
            <div className="skeleton skeleton-list-item" style={{ height: '70px' }} />
          </div>
        ) : historicoPlanos.length === 0 ? (
          <div className="empty-history-box">
            <div className="empty-history-icon">
              <FileText size={32} />
            </div>
            <h5>Nenhum plano alimentar gerado ainda</h5>
            <p>
              Clique no botão <strong>"✨ Gerar Plano com IA"</strong> acima para criar o primeiro cardápio semanal personalizado baseado no perfil deste paciente.
            </p>
          </div>
        ) : (
          <div className="history-cards-grid">
            {historicoPlanos.map((item) => {
              const isSelected = planoOriginalId === item.id;
              const conteudo = typeof item.conteudo === 'string' ? JSON.parse(item.conteudo) : item.conteudo;
              const totalDias = conteudo?.plano_semanal?.length || 7;
              const foiIA = conteudo?.gerado_com_ia !== false;

              return (
                <div 
                  key={item.id} 
                  className={`history-plan-item ${isSelected ? 'active-history-card' : ''}`}
                  onClick={() => handleCarregarPlanoDoHistorico(item)}
                >
                  <div className="history-item-top">
                    <div className="history-date-info">
                      <Calendar size={15} />
                      <span className="history-date-text">{formatarData(item.created_at)}</span>
                    </div>
                    {foiIA ? (
                      <span className="badge-ai-pill">✨ Gerado com IA</span>
                    ) : (
                      <span className="badge-manual-pill">Plano Manual</span>
                    )}
                  </div>

                  <div className="history-item-body">
                    <p className="history-summary">
                      Cardápio semanal completo ({totalDias} dias estruturados com 5 opções por refeição).
                    </p>
                  </div>

                  <div className="history-item-footer">
                    <span className="history-view-btn">
                      {isSelected ? 'Em visualização' : 'Carregar no editor'}
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
