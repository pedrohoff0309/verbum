import { useState, useEffect, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [verificando, setVerificando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    // Verificação inicial
    supabase.auth.getSession().then(({ data }) => {
      setAutenticado(!!data.session)
      setVerificando(false)
    })

    // Ouvir mudanças de sessão (login/logout em outra aba, expiração de token)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(!!session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (verificando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          color: '#9CA3AF',
          fontSize: '14px',
          gap: '10px',
        }}
      >
        <Spinner />
        Verificando sessão…
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
