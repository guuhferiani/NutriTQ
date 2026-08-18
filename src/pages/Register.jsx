import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../lib/auth';
import { sql } from '../lib/db';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Leaf, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 9;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 9) {
      return setError('A senha deve ter no mínimo 9 caracteres.');
    }

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp.email({
        email,
        password,
        name,
      });

      if (signUpError) {
        throw signUpError;
      }

      // Inserir no banco de dados Neon a tabela nutricionistas
      try {
        await sql`
          INSERT INTO nutricionistas (id, nome, email, created_at)
          VALUES (gen_random_uuid(), ${name}, ${email}, NOW() AT TIME ZONE 'America/Sao_Paulo')
        `;
      } catch (dbError) {
        console.error("Erro ao inserir no BD", dbError);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Falha ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="logo-header">
          <div className="brand-icon-box">
            <Leaf size={28} strokeWidth={2.2} />
          </div>
          <h1>Nutri<span>TQ</span></h1>
          <p>Crie sua conta de Nutricionista</p>
        </div>

        {error && (
          <div className="error-message" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Nome completo</label>
            <div className="input-wrapper">
              <span className="input-icon-prefix">
                <User size={18} />
              </span>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Dra. Maria Silva"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">E-mail profissional</label>
            <div className="input-wrapper">
              <span className="input-icon-prefix">
                <Mail size={18} />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <span className="input-icon-prefix">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 9 caracteres"
                minLength={9}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <div className="input-wrapper">
              <span className="input-icon-prefix">
                <Lock size={18} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repita sua senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {(password.length > 0 || confirmPassword.length > 0) && (
            <div className="password-requirements">
              <div className={`requirement-item ${hasMinLength ? 'valid' : ''}`}>
                <CheckCircle2 size={14} />
                <span>Pelo menos 9 caracteres</span>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`requirement-item ${passwordsMatch ? 'valid' : ''}`}>
                  <CheckCircle2 size={14} />
                  <span>As senhas coincidem</span>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Criando sua conta...</span>
              </>
            ) : (
              <>
                <span>Cadastrar e Começar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
