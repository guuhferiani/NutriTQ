import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { gerarPlanoComIA } from './api/gerar-plano.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-server-middleware',
        configureServer(server) {
          server.middlewares.use('/api/gerar-plano', async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              return res.end();
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Método não permitido.' }));
            }

            let rawBody = '';
            req.on('data', chunk => {
              rawBody += chunk;
            });

            req.on('end', async () => {
              try {
                const body = JSON.parse(rawBody || '{}');
                const dadosPaciente = body.dados_do_paciente || body.paciente;

                if (!dadosPaciente) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    error: 'Dados do paciente não informados.'
                  }));
                }

                const apiKey = env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    error: 'Chave GOOGLE_API_KEY não configurada no .env.local.'
                  }));
                }

                const plano = await gerarPlanoComIA(dadosPaciente, apiKey);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: true,
                  plano
                }));
              } catch (error) {
                console.error('Erro na rota /api/gerar-plano:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: false,
                  error: 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
                  details: error.message
                }));
              }
            });
          });
        }
      }
    ],
  };
});
