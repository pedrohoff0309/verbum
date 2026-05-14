export interface Leitura {
  id: string
  user_id: string
  data_leitura: string
  titulo: string | null
  tempo_liturgico: string | null
  primeira_leitura: string | null
  salmo: string | null
  segunda_leitura: string | null
  evangelho: string
  referencias: string | null
  frase_destaque: string | null
  created_at: string
}

export interface Explicacao {
  id: string
  leitura_id: string
  conteudo: string
  created_at: string
  updated_at: string
}

export interface LeituraDoDia {
  id: string
  data_leitura: string
  titulo: string | null
  tempo_liturgico: string | null
  primeira_leitura: string | null
  salmo: string | null
  segunda_leitura: string | null
  evangelho: string
  referencias: string | null
  frase_destaque: string | null
  explicacao: string | null
}

export interface Lead {
  id: string
  nome: string
  whatsapp: string
  idade: number | null
  genero: string | null
  ativo: boolean
  created_at: string
}

export interface LeituraFormData {
  data_leitura: string
  titulo: string
  tempo_liturgico: string
  primeira_leitura: string
  salmo: string
  segunda_leitura: string
  evangelho: string
  referencias: string
  frase_destaque: string
}

export interface LeadFormData {
  nome: string
  whatsapp: string
  idade: string
  genero: string
}
