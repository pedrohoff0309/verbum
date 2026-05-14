import { useState, useEffect, useCallback, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { gerarExplicacao } from '../services/gemini'
import { useSalvarLeitura } from '../hooks/useSalvarLeitura'
import type { LeituraFormData } from '../types'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface ProximaLeitura {
  id: string
  data_leitura: string
  referencias: string
  tempo_liturgico: string
}

interface LeituraCadastrada {
  id: string
  data_leitura: string
  titulo: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dataHoje(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8C7B6B',
  marginBottom: '6px',
}

const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#FFFFFF',
  border: '1px solid #E8DFD0',
  borderRadius: '6px',
  padding: '9px 12px',
  fontSize: '14px',
  color: '#2C1A0E',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const textarea: React.CSSProperties = {
  ...input,
  resize: 'vertical',
  lineHeight: 1.65,
}

const btn = (
  bg: string,
  disabled: boolean,
): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: disabled ? '#9CA3AF' : bg,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: 'inherit',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background 0.15s',
})

// ─── Login Gate ───────────────────────────────────────────────────────────────

function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro(error.message)
    else onLogin()
    setCarregando(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F0E8',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          padding: '0 24px',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#8C7B6B',
            marginBottom: '8px',
          }}
        >
          Verbum · Admin
        </p>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#2C1A0E',
            marginBottom: '28px',
          }}
        >
          Entrar
        </h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={label}>E-mail</label>
            <input
              style={input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label style={label}>Senha</label>
            <input
              style={input}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          {erro && (
            <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{erro}</p>
          )}
          <button type="submit" disabled={carregando} style={btn('#C0622A', carregando)}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const { salvando, salvarLeitura } = useSalvarLeitura()

  const [autenticado, setAutenticado] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string>('')

  const [form, setForm] = useState<LeituraFormData>({
    data_leitura: dataHoje(),
    titulo: '',
    tempo_liturgico: '',
    referencias: '',
    primeira_leitura: '',
    salmo: '',
    segunda_leitura: '',
    evangelho: '',
    frase_destaque: '',
  })

  const [explicacao, setExplicacao] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroGemini, setErroGemini] = useState<string | null>(null)
  const [salvoOk, setSalvoOk] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  // ── Próximas leituras ──────────────────────────────────────────────────────
  const [proximasLeituras, setProximasLeituras] = useState<ProximaLeitura[]>([])
  const [carregandoLista, setCarregandoLista] = useState(false)

  // ── Todas as leituras ──────────────────────────────────────────────────────
  const [todasLeituras, setTodasLeituras] = useState<LeituraCadastrada[]>([])
  const [carregandoTodas, setCarregandoTodas] = useState(false)
  const [idExcluindo, setIdExcluindo] = useState<string | null>(null)

  const buscarProximasLeituras = useCallback(async () => {
    setCarregandoLista(true)
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('leituras')
      .select('id, data_leitura, referencias, tempo_liturgico')
      .gte('data_leitura', hoje)
      .order('data_leitura', { ascending: true })
      .limit(7)
    setProximasLeituras(data ?? [])
    setCarregandoLista(false)
  }, [])

  const buscarTodasLeituras = useCallback(async () => {
    setCarregandoTodas(true)
    const { data } = await supabase
      .from('leituras')
      .select('id, data_leitura, titulo')
      .order('data_leitura', { ascending: false })
    setTodasLeituras(data ?? [])
    setCarregandoTodas(false)
  }, [])

  useEffect(() => {
    if (autenticado) {
      buscarProximasLeituras()
      buscarTodasLeituras()
    }
  }, [autenticado, buscarProximasLeituras, buscarTodasLeituras])

  const handleExcluir = async (id: string, dataStr: string) => {
    const dataFormatada = new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    
    if (!window.confirm(`Tem certeza que deseja excluir a leitura de ${dataFormatada}? Esta ação não pode ser desfeita.`)) {
      return
    }

    setIdExcluindo(id)
    try {
      // Passo 1: deletar explicação vinculada
      const { error: errExp } = await supabase.from('explicacoes').delete().eq('leitura_id', id)
      if (errExp) throw errExp

      // Passo 2: deletar a leitura
      const { error: errLeitura } = await supabase.from('leituras').delete().eq('id', id)
      if (errLeitura) throw errLeitura

      // Sucesso: atualizar listas sem recarregar a página
      setTodasLeituras(prev => prev.filter(l => l.id !== id))
      buscarProximasLeituras()
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`)
    } finally {
      setIdExcluindo(null)
    }
  }

  // ── Verificar sessão ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAutenticado(true)
        setUserId(data.user.id)
      } else {
        setAutenticado(false)
      }
    })
  }, [])

  // ── Aguardar verificação ───────────────────────────────────────────────────
  if (autenticado === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          color: '#8C7B6B',
          fontSize: '14px',
        }}
      >
        Verificando sessão…
      </div>
    )
  }

  if (!autenticado) {
    return <LoginGate onLogin={() => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) { setAutenticado(true); setUserId(data.user.id) }
      })
    }} />
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const set = (campo: keyof LeituraFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [campo]: e.target.value }))

  const handleGerar = async () => {
    if (!form.evangelho.trim()) {
      setErroGemini('Preencha o Evangelho antes de gerar a reflexão.')
      return
    }
    setGerando(true)
    setErroGemini(null)
    setSalvoOk(false)
    try {
      const texto = await gerarExplicacao(form)
      setExplicacao(texto)
    } catch (err) {
      setErroGemini(err instanceof Error ? err.message : 'Erro ao chamar o Gemini.')
    } finally {
      setGerando(false)
    }
  }

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault()
    setErroSalvar(null)
    setSalvoOk(false)
    if (!explicacao.trim()) {
      setErroSalvar('Gere ou escreva a reflexão antes de salvar.')
      return
    }
    const ok = await salvarLeitura(form, explicacao, userId)
    if (ok) {
      setSalvoOk(true)
      buscarProximasLeituras()
      buscarTodasLeituras()
    } else {
      setErroSalvar('Erro ao salvar. Verifique o console.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAutenticado(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: '#F5F0E8',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    color: '#2C1A0E',
  }

  const container: React.CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '0 24px',
  }

  const section: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E8DFD0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '16px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#8C7B6B',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #EDE4D8',
  }

  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  }

  return (
    <div style={page}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid #E8DFD0',
          background: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            ...container,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '52px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link
              to="/"
              style={{
                fontSize: '13px',
                color: '#8C7B6B',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ← Ver site
            </Link>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#2C1A0E',
              }}
            >
              Verbum · Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: '#8C7B6B',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main style={{ ...container, paddingTop: '32px', paddingBottom: '64px' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '24px',
            color: '#2C1A0E',
          }}
        >
          Nova leitura
        </h1>

        <form onSubmit={handleSalvar}>

          {/* ── METADADOS ─────────────────────────────────────────────── */}
          <div style={section}>
            <p style={sectionTitle}>Metadados</p>
            <div style={{ ...grid2, marginBottom: '16px' }}>
              <div>
                <label style={label}>Data da leitura</label>
                <input
                  style={input}
                  type="date"
                  value={form.data_leitura}
                  onChange={set('data_leitura')}
                  required
                  min={undefined}
                  max={undefined}
                />
              </div>
              <div>
                <label style={label}>Tempo litúrgico</label>
                <input
                  style={input}
                  type="text"
                  placeholder="ex: 4º Domingo de Páscoa"
                  value={form.tempo_liturgico}
                  onChange={set('tempo_liturgico')}
                />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={label}>Título editorial</label>
              <input
                style={input}
                type="text"
                placeholder="ex: O Espírito Santo que nos sustenta no caminho"
                value={form.titulo}
                onChange={set('titulo')}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={label}>Referências do evangelho</label>
              <input
                style={input}
                type="text"
                placeholder="ex: Jo 10, 1-10"
                value={form.referencias}
                onChange={set('referencias')}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={label}>
                Frase de destaque{' '}
                <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>
                  (opcional)
                </span>
              </label>
              <textarea
                style={{ ...textarea, minHeight: '70px' }}
                placeholder="ex: \u201cEu sou o caminho, a verdade e a vida.\u201d"
                value={form.frase_destaque}
                onChange={set('frase_destaque')}
                rows={3}
              />
            </div>
          </div>

          {/* ── LEITURAS ──────────────────────────────────────────────── */}
          <div style={section}>
            <p style={sectionTitle}>Leituras</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={label}>Primeira leitura</label>
                <textarea
                  style={{ ...textarea, minHeight: '90px' }}
                  placeholder="Texto da primeira leitura…"
                  value={form.primeira_leitura}
                  onChange={set('primeira_leitura')}
                  rows={4}
                />
              </div>
              <div>
                <label style={label}>Salmo</label>
                <textarea
                  style={{ ...textarea, minHeight: '70px' }}
                  placeholder="Texto do salmo responsorial…"
                  value={form.salmo}
                  onChange={set('salmo')}
                  rows={3}
                />
              </div>
              <div>
                <label style={label}>
                  Segunda leitura{' '}
                  <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>
                    (opcional)
                  </span>
                </label>
                <textarea
                  style={{ ...textarea, minHeight: '70px' }}
                  placeholder="Deixe vazio se não houver…"
                  value={form.segunda_leitura}
                  onChange={set('segunda_leitura')}
                  rows={3}
                />
              </div>
              <div>
                <label style={label}>
                  Evangelho{' '}
                  <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  style={{ ...textarea, minHeight: '110px' }}
                  placeholder="Texto do evangelho…"
                  value={form.evangelho}
                  onChange={set('evangelho')}
                  required
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* ── REFLEXÃO ─────────────────────────────────────────────── */}
          <div style={section}>
            <p style={sectionTitle}>Reflexão (Gemini)</p>

            <button
              type="button"
              onClick={handleGerar}
              disabled={gerando}
              style={{ ...btn('#C0622A', gerando), marginBottom: '16px' }}
            >
              {gerando ? (
                <>
                  <Spinner /> Gerando…
                </>
              ) : (
                '✦ Gerar reflexão com Gemini'
              )}
            </button>

            {erroGemini && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#DC2626',
                  marginBottom: '12px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '6px',
                  padding: '8px 12px',
                }}
              >
                {erroGemini}
              </p>
            )}

            <div>
              <label style={label}>Reflexão gerada (editável)</label>
              <textarea
                style={{ ...textarea, minHeight: '240px', fontFamily: 'inherit' }}
                placeholder="A reflexão gerada pelo Gemini aparecerá aqui. Você pode editar antes de salvar."
                value={explicacao}
                onChange={(e) => setExplicacao(e.target.value)}
                rows={12}
              />
            </div>
          </div>

          {/* ── AÇÕES ────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="submit"
              disabled={salvando}
              style={btn('#C0622A', salvando)}
            >
              {salvando ? (
                <>
                  <Spinner /> Salvando…
                </>
              ) : (
                'Salvar no banco'
              )}
            </button>

            {salvoOk && (
              <span
                style={{
                  fontSize: '13px',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ✓ Leitura salva com sucesso
              </span>
            )}

            {erroSalvar && (
              <span style={{ fontSize: '13px', color: '#DC2626' }}>
                ✕ {erroSalvar}
              </span>
            )}
          </div>
        </form>

        {/* ── PRÓXIMAS 7 LEITURAS ─────────────────────────────────────── */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8DFD0',
            borderRadius: '8px',
            padding: '24px',
            marginTop: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #EDE4D8',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8C7B6B',
                margin: 0,
              }}
            >
              Próximas leituras agendadas
            </p>
            <button
              type="button"
              onClick={buscarProximasLeituras}
              disabled={carregandoLista}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '12px',
                color: '#8C7B6B',
                cursor: carregandoLista ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {carregandoLista ? 'Atualizando…' : '↻ Atualizar'}
            </button>
          </div>

          {carregandoLista && proximasLeituras.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8C7B6B', margin: 0 }}>
              Carregando…
            </p>
          ) : proximasLeituras.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8C7B6B', margin: 0 }}>
              Nenhuma leitura agendada a partir de hoje.
            </p>
          ) : (
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {proximasLeituras.map((l, i) => (
                <li
                  key={l.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 110px 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: i % 2 === 0 ? '#F8F3EC' : '#FFFFFF',
                    fontSize: '13px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#8C7B6B',
                      textAlign: 'right',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: '#2C1A0E',
                      fontWeight: 500,
                    }}
                  >
                    {new Date(l.data_leitura + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                  <span style={{ color: '#2C1A0E' }}>
                    {l.referencias || <em style={{ color: '#8C7B6B' }}>sem referência</em>}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#8C7B6B',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.tempo_liturgico}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── GERENCIAR LEITURAS ─────────────────────────────────────── */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8DFD0',
            borderRadius: '8px',
            padding: '24px',
            marginTop: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #EDE4D8',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8C7B6B',
                margin: 0,
              }}
            >
              Gerenciar Leituras
            </p>
            <button
              type="button"
              onClick={buscarTodasLeituras}
              disabled={carregandoTodas}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '12px',
                color: '#8C7B6B',
                cursor: carregandoTodas ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {carregandoTodas ? 'Atualizando…' : '↻ Atualizar'}
            </button>
          </div>

          {carregandoTodas && todasLeituras.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8C7B6B', margin: 0 }}>
              Carregando…
            </p>
          ) : todasLeituras.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8C7B6B', margin: 0 }}>
              Nenhuma leitura cadastrada.
            </p>
          ) : (
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {todasLeituras.map((l, i) => (
                <li
                  key={l.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 130px 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: i % 2 === 0 ? '#F8F3EC' : '#FFFFFF',
                    fontSize: '13px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#8C7B6B',
                      textAlign: 'right',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: '#2C1A0E',
                      fontWeight: 500,
                    }}
                  >
                    {new Date(l.data_leitura + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span style={{ color: '#2C1A0E' }}>
                    {l.titulo || <em style={{ color: '#8C7B6B' }}>sem título</em>}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExcluir(l.id, l.data_leitura)}
                    disabled={idExcluindo === l.id}
                    className="text-red-600 border border-red-300 hover:bg-red-50 rounded px-3 py-1 text-sm"
                    style={{
                      cursor: idExcluindo === l.id ? 'not-allowed' : 'pointer',
                      opacity: idExcluindo === l.id ? 0.5 : 1,
                    }}
                  >
                    {idExcluindo === l.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  )
}

// ─── Spinner minimalista ──────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
