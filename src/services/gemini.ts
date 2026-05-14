import type { LeituraFormData } from '../types'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

export async function gerarExplicacao(leitura: LeituraFormData): Promise<string> {
  const segundaLeituraBloco = leitura.segunda_leitura.trim()
    ? `SEGUNDA LEITURA: ${leitura.segunda_leitura}`
    : ''

  const prompt = `Você é um estudioso da Bíblia Católica com profundo conhecimento da tradição cristã.
Escreva uma reflexão sobre as leituras do dia de forma humanizada, fluida, sem tópicos ou bullets.
Seja assertivo e profundo, mas acessível. Use parágrafos corridos. Não use cabeçalhos.
A reflexão deve ter entre 4 e 6 parágrafos.

DATA: ${leitura.data_leitura}
TEMPO LITÚRGICO: ${leitura.tempo_liturgico}
PRIMEIRA LEITURA: ${leitura.primeira_leitura}
SALMO: ${leitura.salmo}
${segundaLeituraBloco}
EVANGELHO (${leitura.referencias}): ${leitura.evangelho}

Escreva a reflexão agora:`

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1200,
    },
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    const mensagem = data?.error?.message ?? 'Erro desconhecido na API do Gemini.'
    throw new Error(mensagem)
  }

  const texto: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!texto) {
    throw new Error('A API do Gemini não retornou texto na resposta.')
  }

  return texto.trim()
}
