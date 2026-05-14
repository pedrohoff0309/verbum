import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import type { LeituraDoDia } from '../types'

interface UseLeituraHojeReturn {
  leitura: LeituraDoDia | null
  loading: boolean
  erro: string | null
  recarregar: () => void
}

export function useLeituraHoje(dataParam: string | null = null): UseLeituraHojeReturn {
  const [leitura, setLeitura] = useState<LeituraDoDia | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)

    if (dataParam) {
      // ── Consulta direta nas tabelas base para uma data específica ─────────
      const { data, error } = await supabase
        .from('leituras')
        .select(
          'id, data_leitura, titulo, tempo_liturgico, primeira_leitura, salmo, segunda_leitura, evangelho, referencias, frase_destaque, explicacoes(conteudo)',
        )
        .eq('data_leitura', dataParam)
        .maybeSingle()

      if (error) {
        setErro(error.message)
      } else if (!data) {
        setLeitura(null)
      } else {
        const explicacaoArr = data.explicacoes as Array<{ conteudo: string }> | null
        setLeitura({
          id: data.id,
          data_leitura: data.data_leitura,
          titulo: data.titulo,
          tempo_liturgico: data.tempo_liturgico,
          primeira_leitura: data.primeira_leitura,
          salmo: data.salmo,
          segunda_leitura: data.segunda_leitura,
          evangelho: data.evangelho,
          referencias: data.referencias,
          frase_destaque: data.frase_destaque,
          explicacao: explicacaoArr?.[0]?.conteudo ?? null,
        })
      }
    } else {
      // ── Comportamento padrão: view leitura_do_dia (hoje) ─────────────────
      const { data, error } = await supabase
        .from('leitura_do_dia')
        .select('*')
        .single()

      if (error) {
        // PGRST116 = nenhuma linha encontrada — não é um erro real
        if (error.code === 'PGRST116') {
          setLeitura(null)
        } else {
          setErro(error.message)
        }
      } else {
        setLeitura(data as LeituraDoDia)
      }
    }

    setLoading(false)
  }, [dataParam])

  useEffect(() => {
    buscar()
  }, [buscar])

  return { leitura, loading, erro, recarregar: buscar }
}
