'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInviteClient() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<{ email: string; full_name: string } | null>(null)
  const [checking, setChecking] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) { setChecking(false); return }
    supabase.from('invitations').select('email, full_name, expires_at, accepted_at')
      .eq('token', token).single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Invalid or expired invitation.') }
        else if (data.accepted_at) { setError('This invitation has already been used.') }
        else if (new Date(data.expires_at) < new Date()) { setError('This invitation has expired.') }
        else setInvite({ email: data.email, full_name: data.full_name })
        setChecking(false)
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
    if (!res.ok) { setError(data.error || 'Failed to activate account.'); setLoading(false); return }
    router.push('/login')
  }

  if (checking) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D0D0D' }}>
      <div style={{ color:'#555', fontSize:14 }}>Verifying invitation...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D0D0D', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:44, height:44, background:'#FFCB1A', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20, color:'#000', margin:'0 auto 16px' }}>L</div>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 6px' }}>Welcome to LHC OS</h1>
          {invite && <p style={{ color:'#555', fontSize:14, margin:0 }}>Setting up <strong style={{ color:'#FFCB1A' }}>{invite.email}</strong></p>}
        </div>
        <div style={{ background:'#1A1A1A', borderRadius:16, border:'1px solid #222', padding:28 }}>
          {error ? (
            <div style={{ color:'#ff6b6b', textAlign:'center', padding:16, fontSize:14 }}>{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {[
                { label:'CREATE PASSWORD', key:'pwd', val:password, set:setPassword, placeholder:'Min. 8 characters' },
                { label:'CONFIRM PASSWORD', key:'conf', val:confirm, set:setConfirm, placeholder:'Repeat password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#444', letterSpacing:'0.1em', marginBottom:7 }}>{f.label}</label>
                  <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder} required minLength={8}
                    style={{ width:'100%', padding:'10px 13px', background:'#111', border:'1px solid #222',
                      borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' as any, fontFamily:'inherit' }}
                  />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                width:'100%', padding:12, background:'#FFCB1A', border:'none',
                borderRadius:9, color:'#000', fontSize:14, fontWeight:700,
                cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'inherit', marginTop:4
              }}>
                {loading ? 'Activating...' : 'ACTIVATE ACCOUNT →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
