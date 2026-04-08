'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LOGO_WHITE } from '@/lib/logo'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

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
      minHeight:'100vh', background:'#080808', display:'flex',
      position:'relative', overflow:'hidden'
    }}>
      <div style={{
        position:'absolute', inset:0, opacity:0.04,
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'#FFCB1A' }} />

      {/* Left branding panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 80px', maxWidth:560 }}>
        <img src={LOGO_WHITE} alt="Lighthouse Construction" style={{ height:36, width:'auto', maxWidth:240, marginBottom:48 }} />
        <div>
          <div style={{ fontSize:11, color:'#FFCB1A', letterSpacing:'0.18em', fontWeight:600, marginBottom:16 }}>
            INTERNAL OPERATING SYSTEM
          </div>
          <h1 style={{ fontSize:42, fontWeight:700, color:'#fff', lineHeight:1.15, margin:'0 0 20px', letterSpacing:'-0.02em' }}>
            The command<br />center for LHC.
          </h1>
          <p style={{ fontSize:16, color:'#555', lineHeight:1.7, maxWidth:360 }}>
            Track every project, task, and team update — all in one place, built for Lighthouse Construction.
          </p>
        </div>
        <div style={{ display:'flex', gap:32, marginTop:48 }}>
          {[{ value:'7', label:'Departments' }, { value:'360°', label:'Visibility' }, { value:'Live', label:'Updates' }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:22, fontWeight:700, color:'#FFCB1A' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#444', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div style={{ width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 48px', background:'rgba(255,255,255,0.02)', borderLeft:'1px solid #1A1A1A' }}>
        <div style={{ width:'100%', maxWidth:360 }}>
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:24, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Sign in</h2>
            <p style={{ color:'#444', fontSize:14 }}>Use your @lighthouseegypt.com account</p>
          </div>

          <form onSubmit={handleLogin} method="post">
            <div style={{ marginBottom:18 }}>
              <label htmlFor="email" style={{ display:'block', fontSize:11, fontWeight:600, color:'#444', letterSpacing:'0.1em', marginBottom:7 }}>EMAIL</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@lighthouseegypt.com"
                required
                autoComplete="email"
                style={{
                  width:'100%', padding:'11px 14px', background:'#111',
                  border:'1px solid #222', borderRadius:9, color:'#fff',
                  fontSize:14, outline:'none', fontFamily:'inherit',
                  WebkitAppearance:'none', boxSizing:'border-box'
                }}
              />
            </div>
            <div style={{ marginBottom:8 }}>
              <label htmlFor="password" style={{ display:'block', fontSize:11, fontWeight:600, color:'#444', letterSpacing:'0.1em', marginBottom:7 }}>PASSWORD</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width:'100%', padding:'11px 14px', background:'#111',
                  border:'1px solid #222', borderRadius:9, color:'#fff',
                  fontSize:14, outline:'none', fontFamily:'inherit',
                  WebkitAppearance:'none', boxSizing:'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{ padding:'10px 13px', background:'rgba(192,57,43,0.12)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:8, color:'#ff7b6b', fontSize:13, marginBottom:18 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%', padding:'12px', background:'#FFCB1A',
                border:'none', borderRadius:9, color:'#000', fontSize:14,
                fontWeight:700, cursor:loading?'not-allowed':'pointer',
                opacity:loading?0.7:1, letterSpacing:'0.06em',
                fontFamily:'inherit', marginTop:8, WebkitAppearance:'none'
              }}>
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
