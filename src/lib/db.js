import { neon } from '@neondatabase/serverless';

const dbUrl = import.meta.env.VITE_DATABASE_URL;

let neonSql = null;
if (dbUrl) {
  try {
    neonSql = neon(dbUrl, {
      disableWarningInBrowsers: true,
    });
  } catch (err) {
    console.error('Erro ao inicializar conexão Neon:', err);
  }
} else {
  console.warn('Aviso: VITE_DATABASE_URL não foi definida nas variáveis de ambiente.');
}

export const sql = async (...args) => {
  if (!neonSql) {
    throw new Error('VITE_DATABASE_URL não configurada. Configure as variáveis de ambiente na Vercel.');
  }
  return neonSql(...args);
};
