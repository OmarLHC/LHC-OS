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
      background: '#080808',
      display: 'flex',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Diamond pattern background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none',
      }} />
      {/* Gold left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#FFCB1A' }} />

      {/* LEFT PANEL — Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 72px',
        maxWidth: 600,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 52 }}>
          <img
            src="/logo-cube.png"
            alt="LHC"
            style={{ width: 44, height: 44, objectFit: 'contain' }}
          />
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.06em' }}>LIGHTHOUSE</div>
            <div style={{ color: '#444', fontSize: 11, letterSpacing: '0.14em' }}>CONSTRUCTION OS</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 11, color: '#FFCB1A', letterSpacing: '0.18em', fontWeight: 600, marginBottom: 18 }}>
            INTERNAL OPERATING SYSTEM
          </div>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.1,
            margin: '0 0 22px',
            letterSpacing: '-0.02em',
          }}>
            The command<br />center for LHC.
          </h1>
          <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, maxWidth: 400, margin: 0 }}>
            Track every project, task, and team update — all in one place, built for Lighthouse Construction.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40 }}>
          {[
            { value: '7', label: 'Departments' },
            { value: '360°', label: 'Visibility' },
            { value: 'Live', label: 'Updates' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#FFCB1A' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#444', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — Login form */}
      <div style={{
        width: 440,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 44px',
        background: 'rgba(255,255,255,0.015)',
        borderLeft: '1px solid #1C1C1C',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Sign in</h2>
            <p style={{ color: '#444', fontSize: 14, margin: 0 }}>Use your @lighthouseegypt.com account</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="email" style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: '#444', letterSpacing: '0.1em', marginBottom: 7
              }}>EMAIL</label>
              <input
                id="email" name="email" type="email"
                placeholder="you@lighthouseegypt.com"
                required autoComplete="email"
                style={{
                  display: 'block', width: '100%', padding: '11px 14px',
                  background: '#111', border: '1px solid #222', borderRadius: 9,
                  color: '#fff', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box' as any,
                }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label htmlFor="password" style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: '#444', letterSpacing: '0.1em', marginBottom: 7
              }}>PASSWORD</label>
              <input
                id="password" name="password" type="password"
                placeholder="••••••••"
                required autoComplete="current-password"
                style={{
                  display: 'block', width: '100%', padding: '11px 14px',
                  background: '#111', border: '1px solid #222', borderRadius: 9,
                  color: '#fff', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box' as any,
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 13px', marginBottom: 16, marginTop: 12,
                background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)',
                borderRadius: 8, color: '#ff7b6b', fontSize: 13,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'block', width: '100%', padding: 13, marginTop: 16,
              background: '#FFCB1A', border: 'none', borderRadius: 9,
              color: '#000', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
            }}>
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#282828', fontSize: 12, marginTop: 28 }}>
            Access restricted to Lighthouse Construction employees
          </p>
        </div>
      </div>
    </div>
  )
}
