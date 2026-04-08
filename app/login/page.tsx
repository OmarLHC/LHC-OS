'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    if (!email.endsWith('@lighthouseegypt.com')) {
      setError('Please use your @lighthouseegypt.com email address.')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: '44px', height: '44px', background: '#FFCB1A',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '800', fontSize: '22px', color: '#000'
            }}>L</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: '700', letterSpacing: '0.06em' }}>
                LIGHTHOUSE
              </div>
              <div style={{ color: '#444', fontSize: '11px', letterSpacing: '0.12em' }}>
                CONSTRUCTION OS
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#161616',
          border: '1px solid #262626',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 6px' }}>
            Sign in
          </h2>
          <p style={{ color: '#555', fontSize: '13px', margin: '0 0 28px' }}>
            Use your @lighthouseegypt.com account
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={{
                display: 'block', color: '#555', fontSize: '11px',
                fontWeight: '600', letterSpacing: '0.08em', marginBottom: '7px'
              }}>EMAIL</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@lighthouseegypt.com"
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0D0D0D',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{
                display: 'block', color: '#555', fontSize: '11px',
                fontWeight: '600', letterSpacing: '0.08em', marginBottom: '7px'
              }}>PASSWORD</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '11px 14px',
                  background: '#0D0D0D',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(192,57,43,0.1)',
                border: '1px solid rgba(192,57,43,0.25)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '13px',
                marginBottom: '16px'
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                padding: '13px',
                background: '#FFCB1A',
                border: 'none',
                borderRadius: '9px',
                color: '#000',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.06em',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit'
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', color: '#2A2A2A',
          fontSize: '12px', marginTop: '20px'
        }}>
          Access restricted to Lighthouse Construction employees
        </p>
      </div>
    </div>
  )
}
