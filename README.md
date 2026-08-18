# NutriTQ 🥗

> Sistema moderno, ágil e inteligente de gestão clínica para nutricionistas.

---

## 🚀 Tecnologias

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Roteamento**: [React Router 7](https://reactrouter.com/)
- **Estilização**: Vanilla CSS com Design System moderno (tokens HSL, Glassmorphism, animações)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Banco de Dados**: [Neon Postgres](https://neon.tech/) Serverless
- **Autenticação**: Neon Auth / Better Auth Client

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
   Crie um arquivo `.env.local` na raiz baseado no `.env.example`:
   ```env
   VITE_NEON_AUTH_URL=https://seu-auth-url.neonauth.aws.neon.tech/neondb/auth
   VITE_DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:5173` no seu navegador.

---

## 📁 Estrutura do Projeto

```
NutriTQ/
├── src/
│   ├── assets/         # Imagens e ícones estáticos
│   ├── components/     # Componentes reutilizáveis (Sidebar, etc.)
│   ├── lib/            # Clientes de banco de dados (Neon) e autenticação
│   ├── pages/          # Páginas (Login, Register, Dashboard, etc.)
│   ├── App.jsx         # Roteamento e controle de sessão protegida
│   ├── index.css       # Design System global
│   └── main.jsx        # Ponto de entrada React
├── index.html          # Template HTML principal
└── package.json        # Dependências e scripts
```
