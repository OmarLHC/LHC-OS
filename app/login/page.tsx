'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LOGO_WHITE } from '@/lib/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.endsWith('@lighthouseegypt.com')) {
      setError('Please use your @lighthouseegypt.com email address.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#080808', display:'flex',
      position:'relative', overflow:'hidden'
    }}>
      {/* Background geometric pattern */}
      <div style={{
        position:'absolute', inset:0, opacity:0.04,
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      {/* Gold accent bar left */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'linear-gradient(180deg, #FFCB1A 0%, #FEEB54 50%, #FFCB1A 100%)' }} />

      {/* Left panel - branding */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'60px 80px',
        maxWidth:560
      }}>
        <img src={LOGO_WHITE} alt="Lighthouse Construction" style={{ height:36, width:'auto', maxWidth:240, marginBottom:48 }} />
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.18em', fontWeight:600, marginBottom:16 }}>
            INTERNAL OPERATING SYSTEM
          </div>
          <h1 style={{ fontSize:42, fontWeight:700, color:'#fff', lineHeight:1.15, margin:'0 0 20px', letterSpacing:'-0.02em' }}>
            The command<br />center for LHC.
          </h1>
          <p style={{ fontSize:16, color:'#555', lineHeight:1.7, maxWidth:360 }}>
            Track every project, task, and team update — all in one place, built for Lighthouse Construction.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:32, marginTop:48 }}>
          {[
            { value:'7', label:'Departments' },
            { value:'360°', label:'Visibility' },
            { value:'Live', label:'Updates' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--gold)' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#444', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        width:460, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'40px 48px', background:'rgba(255,255,255,0.02)',
        borderLeft:'1px solid #1A1A1A'
      }}>
        <div style={{ width:'100%', maxWidth:360 }}>
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:24, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Sign in</h2>
            <p style={{ color:'#444', fontSize:14 }}>Use your @lighthouseegypt.com account</p>
          </div>

          <form onSubmit={handleLogin}>
            {[
              { label:'EMAIL', key:'email', type:'email', placeholder:'you@lighthouseegypt.com', val:email, set:setEmail },
              { label:'PASSWORD', key:'pwd', type:'password', placeholder:'••••••••', val:password, set:setPassword },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#444',
                  letterSpacing:'0.1em', marginBottom:7 }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} required
                  style={{
                    width:'100%', padding:'11px 14px', background:'#111',
                    border:'1px solid #222', borderRadius:9, color:'#fff',
                    fontSize:14, outline:'none', transition:'border-color 0.15s', fontFamily:'inherit'
                  }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor='var(--gold)'}
                  onBlur={e => (e.target as HTMLElement).style.borderColor='#222'}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding:'10px 13px', background:'rgba(192,57,43,0.12)',
                border:'1px solid rgba(192,57,43,0.3)', borderRadius:8,
                color:'#ff7b6b', fontSize:13, marginBottom:18 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', background:'var(--gold)',
              border:'none', borderRadius:9, color:'#000', fontSize:14,
              fontWeight:700, cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1, letterSpacing:'0.06em',
              transition:'opacity 0.15s, transform 0.1s', fontFamily:'inherit',
              marginTop:4
            }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.transform='translateY(-1px)' }}
              onMouseLeave={e => (e.target as HTMLElement).style.transform='none'}>
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>

          <p style={{ textAlign:'center', color:'#2a2a2a', fontSize:12, marginTop:28 }}>
            Access restricted to Lighthouse Construction employees
          </p>
        </div>
      </div>
    </div>
  )
}
