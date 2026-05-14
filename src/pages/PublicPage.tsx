import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useLeituraHoje } from '../hooks/useLeituraHoje'
import { useLeads } from '../hooks/useLeads'
import type { LeadFormData } from '../types'
import { getCorLiturgica, getCorLiturgicaLight } from '../lib/corLiturgica'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(data: Date): string {
  const str = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function msPareaMeiaNotte(agora: Date): number {
  const amanha = new Date(agora)
  amanha.setHours(0, 0, 0, 0)
  amanha.setDate(amanha.getDate() + 1)
  return amanha.getTime() - agora.getTime()
}

function tituloFallback(evangelho: string): string {
  const palavras = evangelho.trim().split(/\s+/).slice(0, 8)
  return palavras.join(' ') + '…'
}

// ─── Skeleton de loading ─────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[100, 88, 95, 72].map((w, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: '16px', width: `${w}%`, borderRadius: '4px', background: '#EDE7DB' }}
        />
      ))}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function PublicPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const [searchParams] = useSearchParams()
  const dataParam = searchParams.get('data')

  const { leitura, loading, recarregar } = useLeituraHoje(dataParam)
  const { salvando, sucesso, erro: erroLead, salvarLead } = useLeads()

  const hojeStr = new Date().toISOString().split('T')[0]
  const dataAtual = dataParam ?? hojeStr
  const isHoje = dataAtual === hojeStr

  const ontemDate = new Date(dataAtual + 'T12:00:00')
  ontemDate.setDate(ontemDate.getDate() - 1)
  const ontemStr = ontemDate.toISOString().split('T')[0]
  const ontemLabel = ontemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const [hoje, setHoje] = useState<Date>(() => new Date())
  useEffect(() => {
    const agendarProximaAtualizacao = () => {
      const ms = msPareaMeiaNotte(new Date())
      const timer = setTimeout(() => {
        setHoje(new Date())
        recarregar()
        agendarProximaAtualizacao()
      }, ms)
      return timer
    }
    const timer = agendarProximaAtualizacao()
    return () => clearTimeout(timer)
  }, [recarregar])

  // ── Abas: 1ª Leitura / Salmo / 2ª Leitura / Evangelho ────────────────────
  const temSegundaLeitura = Boolean(leitura?.segunda_leitura)

  const abas = [
    '1ª Leitura',
    'Salmo',
    ...(temSegundaLeitura ? ['2ª Leitura'] : []),
    'Evangelho',
  ]

  const conteudoAbas = [
    leitura?.primeira_leitura || null,
    leitura?.salmo || null,
    ...(temSegundaLeitura ? [leitura?.segunda_leitura || null] : []),
    leitura?.evangelho || null,
  ]

  const [abaAtiva, setAbaAtiva] = useState(0)
  useEffect(() => { setAbaAtiva(0) }, [dataParam])

  const [copiado, setCopiado] = useState(false)
  const handleCopiarLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const [form, setForm] = useState<LeadFormData>({ nome: '', whatsapp: '', idade: '', genero: '' })
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await salvarLead(form)
  }

  const paragrafos = leitura?.explicacao
    ? leitura.explicacao.split(/\n\n|\n/).filter(Boolean)
    : null

  const tituloDisplay =
    leitura?.titulo || (leitura?.evangelho ? tituloFallback(leitura.evangelho) : '')

  const displayFont: React.CSSProperties = { fontFamily: '"Cormorant Garamond", serif' }

  const container: React.CSSProperties = {
    maxWidth: '680px',
    margin: '0 auto',
    padding: isMobile ? '0 20px' : '0 24px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#8C7B6B',
    marginBottom: '4px',
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 400,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#FFFFFF',
    border: '1px solid #E8DFD0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: '"DM Sans", sans-serif',
    color: '#2C1A0E',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', color: '#2C1A0E', fontFamily: '"DM Sans", sans-serif' }}>

      {/* ── HEADER — sem borderBottom, logo + data com gap mínimo ────────── */}
      <header style={{
        background: '#F5F0E8',
        paddingTop: isMobile ? '28px' : '24px',
        paddingBottom: isMobile ? '12px' : '10px',
        /* SEM borderBottom — linha removida */
      }}>
        <div style={{ ...container, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <img
            src="/logo_verbum (3) (1).png"
            alt="Logo Verbum"
            style={{ height: isMobile ? '210px' : '200px', width: 'auto', display: 'block' }}
          />
          {/* Data maior, colada logo abaixo do logo */}
          <span style={{ fontSize: '16px', color: '#8C7B6B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.02em' }}>
            {formatarData(hoje)}
          </span>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ───────────────────────────────────────────── */}
      <main style={{ ...container, paddingTop: '52px', paddingBottom: '80px' }}>

        {/* ── NAVEGAÇÃO DE DATAS — fonte maior ────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <Link
            to={`/?data=${ontemStr}`}
            style={{ fontSize: '18px', color: '#8C7B6B', textDecoration: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#C0622A' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#8C7B6B' }}
          >
            ← {ontemLabel}
          </Link>
          {!isHoje && (
            <Link
              to="/"
              style={{ fontSize: '18px', color: '#8C7B6B', textDecoration: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#C0622A' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#8C7B6B' }}
            >
              hoje →
            </Link>
          )}
        </div>

        {/* ── ESTADO VAZIO ─────────────────────────────────────────────────── */}
        {!loading && leitura === null && dataParam && (
          <p style={{ fontSize: '15px', color: '#8C7B6B', fontFamily: '"DM Sans", sans-serif', fontStyle: 'italic', marginTop: '48px', textAlign: 'center' }}>
            Nenhuma reflexão para este dia.
          </p>
        )}

        {/* ── SEÇÃO HERO ───────────────────────────────────────────────────── */}
        {(leitura !== null || (!dataParam && !loading)) && (
          <section style={{ marginBottom: '0' }}>

            {/* Badge tempo litúrgico */}
            {leitura?.tempo_liturgico && (() => {
              const cor = getCorLiturgica(leitura.tempo_liturgico)
              const corLight = getCorLiturgicaLight(leitura.tempo_liturgico)
              return (
                <div style={{ marginBottom: '24px' }}>
                  <span style={{
                    display: isMobile ? 'flex' : 'flex',
                    justifyContent: isMobile ? 'center' : 'center',
                    alignItems: 'center',
                    gap: '6px',
                    background: corLight,
                    border: `1px solid ${cor}`,
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: cor,
                    fontFamily: '"DM Sans", sans-serif',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cor, flexShrink: 0 }} />
                    {leitura.tempo_liturgico}
                  </span>
                </div>
              )
            })()}

            {/* H1 */}
            <h1 style={{
              ...displayFont,
              fontSize: isMobile ? 'clamp(32px, 8vw, 40px)' : 'clamp(28px, 6vw, 38px)',
              fontWeight: 500,
              lineHeight: 1.25,
              margin: '0 0 16px',
              textAlign: isMobile ? 'center' : 'center',
              color: leitura?.tempo_liturgico ? getCorLiturgica(leitura.tempo_liturgico) : '#2C1A0E',
            }}>
              {loading ? '\u00A0' : tituloDisplay || 'A Palavra que alimenta o coração'}
            </h1>

            {/* Referências — fonte grande (30px), alinhada ao centro */}
            {leitura?.referencias && (
              <p style={{
                ...displayFont,
                fontStyle: 'italic',
                fontSize: '28px',
                color: '#8C7B6B',
                margin: '0 0 20px',
                textAlign: 'center',
              }}>
                {leitura.referencias}
              </p>
            )}

            {/* Linha decorativa — 50% da largura, sempre centralizada */}
            <div style={{
              width: '50%',
              height: '3px',
              background: leitura?.tempo_liturgico ? getCorLiturgica(leitura.tempo_liturgico) : '#C0622A',
              margin: '0 auto 48px',
            }} />
          </section>
        )}

        {/* ── FRASE DE DESTAQUE ─────────────────────────────────────────── */}
        {leitura?.frase_destaque && (
          <div style={{ borderLeft: '3px solid #C0622A', paddingLeft: '1.5rem', maxWidth: '600px', margin: '0 auto 56px 0' }}>
            <p style={{ ...displayFont, fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.5, color: '#2C1A0E', margin: '0 0 10px', textAlign: 'justify' }}>
              {leitura.frase_destaque}
            </p>
            {leitura.referencias && (
              <span style={{ fontSize: '13px', color: '#8C7B6B', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.02em' }}>
                — {leitura.referencias}
              </span>
            )}
          </div>
        )}

        {/* ── REFLEXÃO — texto justificado ──────────────────────────────── */}
        <section>
          {loading ? (
            <Skeleton />
          ) : paragrafos && paragrafos.length > 0 ? (
            <div>
              {paragrafos.map((p, i) => (
                <p key={i} style={{
                  fontSize: '17px',
                  fontWeight: 300,
                  lineHeight: 1.85,
                  color: '#2C1A0E',
                  margin: 0,
                  marginBottom: '1.6em',
                  fontFamily: '"DM Sans", sans-serif',
                  textAlign: 'justify',
                }}>
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <p style={{ fontStyle: 'italic', fontSize: '16px', color: '#8C7B6B', textAlign: 'center', lineHeight: 1.7, fontFamily: '"DM Sans", sans-serif' }}>
              A reflexão de hoje será publicada em breve.
            </p>
          )}
        </section>

        {/* ── SEPARADOR ─────────────────────────────────────────────────── */}
        <hr style={{ border: 'none', borderTop: '1px solid #E8DFD0', margin: '72px 0' }} />

        {/* ── SHARE BAR — centralizada ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: '12px', marginBottom: '80px' }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent((tituloDisplay ? tituloDisplay + ' — ' : '') + window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? '100%' : 'auto', gap: '6px', padding: '9px 20px',
              border: '1px solid #C0622A', borderRadius: '6px', fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif', color: '#C0622A', background: 'transparent',
              textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s', letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(192,98,42,0.07)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.117 1.522 5.847L.057 23.882l6.196-1.624A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.003-1.371l-.359-.213-3.718.976.992-3.624-.234-.372A9.818 9.818 0 1 1 12 21.818z" />
            </svg>
            Compartilhar no WhatsApp
          </a>
          <button
            onClick={handleCopiarLink}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? '100%' : 'auto', gap: '6px', padding: '9px 20px',
              border: '1px solid #C0622A', borderRadius: '6px', fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif', color: '#C0622A', background: 'transparent',
              cursor: 'pointer', transition: 'background 0.15s', letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,98,42,0.07)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copiado ? 'Link copiado ✓' : 'Copiar link'}
          </button>
        </div>

        {/* ── SEÇÃO LEITURAS (ABAS) — espaçamento generoso ──────────────── */}
        <section>
          <p style={{ ...labelStyle, marginBottom: '20px', fontSize: '12px' }}>Leituras do dia</p>

          {/* Abas */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E8DFD0', marginBottom: '40px', gap: '4px' }}>
            {abas.map((aba, i) => (
              <button
                key={i}
                onClick={() => setAbaAtiva(i)}
                style={{
                  background: abaAtiva === i ? '#C0622A' : 'transparent',
                  border: 'none',
                  borderBottom: abaAtiva === i ? 'none' : '1px solid transparent',
                  marginBottom: '-1px',
                  padding: '9px 18px',
                  borderRadius: '6px 6px 0 0',
                  fontSize: '13px',
                  fontFamily: '"DM Sans", sans-serif',
                  color: abaAtiva === i ? '#FFFFFF' : '#8C7B6B',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  fontWeight: abaAtiva === i ? 500 : 400,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (abaAtiva !== i) {
                    (e.currentTarget as HTMLButtonElement).style.borderBottomColor = '#C0622A'
                      ; (e.currentTarget as HTMLButtonElement).style.borderBottomWidth = '1px'
                      ; (e.currentTarget as HTMLButtonElement).style.borderBottomStyle = 'solid'
                  }
                }}
                onMouseLeave={(e) => {
                  if (abaAtiva !== i) {
                    (e.currentTarget as HTMLButtonElement).style.borderBottomColor = 'transparent'
                  }
                }}
              >
                {aba}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba — texto justificado, linha height generosa */}
          <div style={{ borderLeft: '2px solid #E8DFD0', paddingLeft: '20px' }}>
            <p style={{
              fontStyle: 'italic',
              fontSize: '16px',
              lineHeight: 2.1,
              color: '#8C7B6B',
              margin: 0,
              fontFamily: '"DM Sans", sans-serif',
              whiteSpace: 'pre-wrap',
              textAlign: 'justify',
            }}>
              {conteudoAbas[abaAtiva] || 'Não disponível.'}
            </p>
          </div>
        </section>

        {/* ── FORMULÁRIO DE LEADS ───────────────────────────────────────── */}
        <div style={{ background: '#EDE4D8', border: '1px solid #E8DFD0', borderRadius: '12px', padding: '32px', marginTop: '80px' }}>
          {sucesso ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ ...displayFont, fontSize: '22px', fontWeight: 400, lineHeight: 1.55, color: '#2C1A0E', margin: 0 }}>
                Perfeito, {form.nome}! Você vai receber a reflexão de amanhã no WhatsApp antes de começar o dia. 🙏
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ ...displayFont, fontSize: '20px', fontWeight: 500, margin: '0 0 8px', color: '#2C1A0E' }}>
                Receba a reflexão de amanhã no WhatsApp
              </h2>
              <p style={{ fontSize: '14px', color: '#8C7B6B', margin: '0 0 24px', lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif' }}>
                Antes de começar o dia, a Palavra já estará com você. Gratuito, sem spam.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <LeadField id="nome" label="Nome" placeholder="Seu nome" value={form.nome} onChange={(v) => setForm((f) => ({ ...f, nome: v }))} inputStyle={inputStyle} labelStyle={labelStyle} required />
                  <LeadField id="whatsapp" label="WhatsApp" placeholder="(51) 99999-9999" type="tel" value={form.whatsapp} onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))} inputStyle={inputStyle} labelStyle={labelStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <LeadField id="idade" label="Idade" placeholder="Ex: 45" type="number" value={form.idade} onChange={(v) => setForm((f) => ({ ...f, idade: v }))} inputStyle={inputStyle} labelStyle={labelStyle} />
                  <div>
                    <label htmlFor="genero" style={labelStyle}>Gênero</label>
                    <select id="genero" value={form.genero} onChange={(e) => setForm((f) => ({ ...f, genero: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                    </select>
                  </div>
                </div>
                {erroLead && (
                  <p style={{ fontSize: '13px', color: '#C0622A', margin: '8px 0', fontFamily: '"DM Sans", sans-serif' }}>{erroLead}</p>
                )}
                <button
                  type="submit"
                  disabled={salvando}
                  style={{
                    width: '100%', marginTop: '16px',
                    background: salvando ? '#8C7B6B' : (leitura?.tempo_liturgico ? getCorLiturgica(leitura.tempo_liturgico) : '#B7791F'),
                    color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '12px 24px',
                    fontSize: '14px', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.04em',
                    cursor: salvando ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s ease', fontWeight: 400,
                  }}
                  onMouseEnter={(e) => { if (!salvando) (e.target as HTMLButtonElement).style.opacity = '0.85' }}
                  onMouseLeave={(e) => { if (!salvando) (e.target as HTMLButtonElement).style.opacity = '1' }}
                >
                  {salvando ? 'Enviando…' : 'Quero receber no WhatsApp'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #E8DFD0' }}>
        <div style={{
          ...container,
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between',
          gap: isMobile ? '8px' : '0', textAlign: isMobile ? 'center' : undefined,
          paddingTop: isMobile ? '48px' : '28px', paddingBottom: isMobile ? '48px' : '28px',
        }}>
          <span style={{ ...displayFont, fontSize: isMobile ? '2rem' : '3rem', fontWeight: 600, fontVariant: 'small-caps', letterSpacing: '0.3em', color: '#8C7B6B' }}>
            Verbum
          </span>
          <span style={{ fontSize: '12px', color: '#8C7B6B', fontFamily: '"DM Sans", sans-serif' }}>
            Reflexão diária das santas leituras
          </span>
        </div>
      </footer>
    </div>
  )
}

// ─── Subcomponente: campo de lead ─────────────────────────────────────────────

interface LeadFieldProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
}

function LeadField({ id, label, placeholder, value, onChange, type = 'text', required = false, inputStyle, labelStyle }: LeadFieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id} type={type} placeholder={placeholder} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, borderColor: focused ? '#C0622A' : '#E8DFD0', boxShadow: focused ? '0 0 0 2px rgba(192,98,42,0.12)' : 'none' }}
      />
    </div>
  )
}