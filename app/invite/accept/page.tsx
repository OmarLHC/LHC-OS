'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<{ email: string; full_name: string } | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) return
    supabase.from('invitations').select('email, full_name, expires_at, accepted_at')
      .eq('token', token).single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Invalid or expired invitation.'); return }
        if (data.accepted_at) { setError('This invitation has already been used.'); return }
        if (new Date(data.expires_at) < new Date()) { setError('This invitation has expired.'); return }
        setInvite({ email: data.email, full_name: data.full_name })
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const res = await fetch('/api/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to accept invitation.'); setLoading(false); return }
    router.push('/login?welcome=1')
  }

  if (!token) return <div style={{ padding: '40px', textAlign: 'center', color: '#E24B4A' }}>Invalid invitation link.</div>

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0D0D0D', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', background: '#FFCB1A', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '20px', color: '#000', margin: '0 auto 16px'
          }}>L</div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700 }}>Welcome to LHC OS</h1>
          {invite && <p style={{ color: '#B4B4B5', fontSize: '14px', marginTop: '4px' }}>
            Setting up account for <strong style={{ color: '#FFCB1A' }}>{invite.email}</strong>
          </p>}
        </div>

        <div style={{
          background: '#1A1A1A', borderRadius: '16px',
          border: '0.5px solid #2A2A2A', padding: '32px'
        }}>
          {error ? (
            <div style={{ color: '#E24B4A', textAlign: 'center', padding: '16px' }}>{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#B4B4B5', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  CREATE PASSWORD
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8}
                  style={{ width: '100%', padding: '10px 14px', background: '#111',
                    border: '0.5px solid #2A2A2A', borderRadius: '8px',
                    color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#B4B4B5', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  CONFIRM PASSWORD
                </label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" required
                  style={{ width: '100%', padding: '10px 14px', background: '#111',
                    border: '0.5px solid #2A2A2A', borderRadius: '8px',
                    color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#FFCB1A',
                  border: 'none', borderRadius: '8px', color: '#000',
                  fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Setting up...' : 'ACTIVATE ACCOUNT'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
