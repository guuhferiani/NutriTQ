import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Schema do plano alimentar semanal solicitado no prompt 6
const planoAlimentarSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: "Lista dos 7 dias da semana com suas respectivas 5 refeições",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: "Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)"
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "5 opções saudáveis e variadas para o café da manhã"
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "5 opções saudáveis e práticas para o lanche da manhã"
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "5 opções completas com proteína, carboidrato e vegetais para o almoço"
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "5 opções nutritivas para o lanche da tarde"
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "5 opções balanceadas e leves para o jantar"
              }
            },
            required: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"]
          }
        },
        required: ["dia", "refeicoes"]
      }
    }
  },
  required: ["plano_semanal"]
};

/**
 * Função geradora do plano com fallback de modelos
 */
export async function gerarPlanoComIA(dadosPaciente, apiKey) {
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY não configurada no servidor.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${typeof dadosPaciente === 'string' ? dadosPaciente : JSON.stringify(dadosPaciente, null, 2)}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

  // Lista de modelos suportados com prioridade no gemini-3.6-flash
  const modelos = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
  let ultimoErro = null;

  for (const nomeModelo of modelos) {
    try {
      const model = genAI.getGenerativeModel({
        model: nomeModelo,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: planoAlimentarSchema,
          temperature: 0.7,
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error("Resposta vazia da API do Gemini.");
      }

      // Validação segura com JSON.parse
      const jsonParsed = JSON.parse(responseText);

      if (!jsonParsed.plano_semanal || !Array.isArray(jsonParsed.plano_semanal)) {
        throw new Error("Estrutura do plano semanal inválida.");
      }

      return jsonParsed;
    } catch (err) {
      console.warn(`Tentativa com modelo ${nomeModelo} falhou:`, err.message);
      ultimoErro = err;
    }
  }

  throw ultimoErro || new Error("Falha ao gerar plano alimentar com IA.");
}

/**
 * Serverless handler para Vercel / Node runtime
 */
export default async function handler(req, res) {
  // Configuração de CORS para chamadas locais e produção
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // body continua como string
      }
    }

    const { paciente, dados_do_paciente } = body || {};
    const dadosParaIA = dados_do_paciente || paciente;

    if (!dadosParaIA) {
      return res.status(400).json({
        error: 'Dados do paciente não foram informados no corpo da requisição.'
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Chave GOOGLE_API_KEY não configurada no servidor backend.'
      });
    }

    const planoGerado = await gerarPlanoComIA(dadosParaIA, apiKey);

    return res.status(200).json({
      success: true,
      plano: planoGerado
    });
  } catch (error) {
    console.error('Erro na rota /api/gerar-plano:', error);
    return res.status(500).json({
      success: false,
      error: 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
      details: error.message
    });
  }
}
