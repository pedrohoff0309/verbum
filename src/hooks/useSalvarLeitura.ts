import { useState } from 'react'
import { supabase } from '../services/supabase'
import type { LeituraFormData } from '../types'

interface UseSalvarLeituraReturn {
  salvando: boolean
  salvarLeitura: (
    dados: LeituraFormData,
    explicacao: string,
    userId: string,
  ) => Promise<boolean>
}

export function useSalvarLeitura(): UseSalvarLeituraReturn {
  const [salvando, setSalvando] = useState(false)

  const salvarLeitura = async (
    dados: LeituraFormData,
    explicacao: string,
    userId: string,
  ): Promise<boolean> => {
    setSalvando(true)

    try {
      // Passo 1 — upsert na tabela leituras
      const { data: leituraData, error: leituraError } = await supabase
        .from('leituras')
        .upsert(
          {
            user_id: userId,
            data_leitura: dados.data_leitura,
            titulo: dados.titulo || null,
            tempo_liturgico: dados.tempo_liturgico || null,
            primeira_leitura: dados.primeira_leitura || null,
            salmo: dados.salmo || null,
            segunda_leitura: dados.segunda_leitura || null,
            evangelho: dados.evangelho,
            referencias: dados.referencias || null,
            frase_destaque: dados.frase_destaque || null,
          },
          { onConflict: 'data_leitura' },
        )
        .select('id')
        .single()


      if (leituraError) {
        console.error('[useSalvarLeitura] Erro ao salvar leitura:', leituraError)
        return false
      }

      const leituraId: string = leituraData.id

      // Passo 2 — upsert na tabela explicacoes
      const { error: explicacaoError } = await supabase
        .from('explicacoes')
        .upsert(
          { leitura_id: leituraId, conteudo: explicacao },
          { onConflict: 'leitura_id' },
        )

      if (explicacaoError) {
        console.error('[useSalvarLeitura] Erro ao salvar explicação:', explicacaoError)
        return false
      }

      return true
    } catch (err) {
      console.error('[useSalvarLeitura] Erro inesperado:', err)
      return false
    } finally {
      setSalvando(false)
    }
  }

  return { salvando, salvarLeitura }
}
