import { useState } from 'react'
import { supabase } from '../services/supabase'
import type { LeadFormData } from '../types'

interface UseLeadsReturn {
  salvando: boolean
  sucesso: boolean
  erro: string | null
  salvarLead: (dados: LeadFormData) => Promise<void>
}

export function useLeads(): UseLeadsReturn {
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvarLead = async (dados: LeadFormData): Promise<void> => {
    setSalvando(true)
    setSucesso(false)
    setErro(null)

    const idadeInt = dados.idade.trim() !== '' ? parseInt(dados.idade, 10) : null
    const generoNulo = dados.genero.trim() !== '' ? dados.genero : null

    const { error } = await supabase.from('leads').insert({
      nome: dados.nome,
      whatsapp: dados.whatsapp,
      idade: idadeInt,
      genero: generoNulo,
    })

    if (error) {
      setErro(error.message)
    } else {
      setSucesso(true)
    }

    setSalvando(false)
  }

  return { salvando, sucesso, erro, salvarLead }
}
