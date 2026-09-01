# NutriTQ 🥗

> Sistema moderno, ágil e inteligente de gestão clínica para nutricionistas com geração automatizada de planos alimentares via Inteligência Artificial (Google Gemini).

---

## 🚀 Tecnologias

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Roteamento**: [React Router 7](https://reactrouter.com/)
- **Inteligência Artificial**: [Google Generative AI SDK](https://github.com/google-gemini/generative-ai-js) (Modelos Gemini 2.5 / 3.6 Flash & Pro com Structured JSON Schema)
- **Backend / Serverless**: API Serverless `/api/gerar-plano` com suporte a Vercel Functions e Vite Middleware local
- **Banco de Dados**: [Neon Postgres](https://neon.tech/) Serverless com tabelas relacionais (`nutricionistas`, `pacientes`, `consultas`, `planos_alimentares`)
- **Autenticação**: Neon Auth / Better Auth Client
- **Estilização**: Vanilla CSS com Design System moderno (tokens HSL, Glassmorphism, Micro-animações e responsividade)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## ✨ Principais Funcionalidades

1. **Autenticação Segura**: Login e Cadastro com validações e proteção de rotas.
2. **Dashboard Dinâmico**: Indicadores em tempo real de pacientes ativos, consultas do mês e planos gerados.
3. **Gestão de Pacientes**: Cadastro completo com anamnese em 3 abas (Pessoal, Clínico, Hábitos) e busca em tempo real.
4. **Prontuário & Consultas**:
   - Registro de consultas antropométricas (peso, cintura, quadril, % gordura).
   - Gráfico de evolução de peso temporal interativo.
5. **Geração de Planos Alimentares com IA (Google Gemini)**:
   - Geração semanal estruturada (7 dias, 5 refeições por dia com 5 opções cada).
   - Navegação por abas de dias da semana e inputs totalmente editáveis.
   - Histórico permanente com persistência em JSONB no Neon PostgreSQL.
   - Impressão e exportação rápida do plano alimentar.

---

## 📦 Como Rodar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/guuhferiani/NutriTQ.git
   cd NutriTQ
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto baseado no `.env.example`:
   ```env
   VITE_DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
   VITE_NEON_AUTH_URL=https://seu-auth-url.neonauth.aws.neon.tech/neondb/auth
   GOOGLE_API_KEY=sua_chave_gemini_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:5173` no seu navegador.

---

## 🚀 Deploy em Produção (Vercel)

1. Faça o push do código para o GitHub:
   ```bash
   git add .
   git commit -m "feat: NutriTQ ready for production"
   git push origin main
   ```

2. Importe o repositório na [Vercel](https://vercel.com).
3. Configure as seguintes **Environment Variables** no painel da Vercel:
   - `VITE_DATABASE_URL`: URL de conexão com Neon Postgres.
   - `VITE_NEON_AUTH_URL`: Endpoint de autenticação do Neon Auth.
   - `GOOGLE_API_KEY`: Chave da API Google Gemini para a serverless function.
4. Clique em **Deploy**!
