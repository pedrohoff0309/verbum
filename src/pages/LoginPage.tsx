import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro(error.message)
      setCarregando(false)
    } else {
      navigate('/admin')
    }
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
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: '#FFFFFF',
          border: '1px solid #E8DFD0',
          borderRadius: '12px',
          padding: '40px 36px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '28px',
              fontWeight: 600,
              fontVariant: 'small-caps',
              letterSpacing: '0.18em',
              color: '#2C1A0E',
            }}
          >
            Verbum
          </span>
          <p
            style={{
              fontSize: '12px',
              color: '#8C7B6B',
              marginTop: '6px',
              letterSpacing: '0.04em',
            }}
          >
            Área administrativa
          </p>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={labelStyle}>E-mail</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <input
              style={inputStyle}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <p
              style={{
                fontSize: '13px',
                color: '#DC2626',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '8px 12px',
                margin: 0,
              }}
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              marginTop: '4px',
              background: carregando ? '#8C7B6B' : '#C0622A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '7px',
              padding: '11px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: carregando ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8C7B6B',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#FFFFFF',
  border: '1px solid #E8DFD0',
  borderRadius: '6px',
  padding: '10px 12px',
  fontSize: '14px',
  color: '#2C1A0E',
  fontFamily: 'inherit',
  outline: 'none',
}
