'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LOGO_WHITE } from '@/lib/logo'
import type { Profile } from '@/lib/types'

const NAV = [
  { href: '/dashboard',               label: 'Overview',      icon: <OverviewIcon /> },
  { href: '/dashboard/projects',      label: 'Projects',      icon: <ProjectsIcon /> },
  { href: '/dashboard/announcements', label: 'Announcements', icon: <AnnIcon /> },
  { href: '/dashboard/people',        label: 'People',        icon: <PeopleIcon /> },
  { href: '/dashboard/admin',         label: 'Admin',         icon: <AdminIcon />, adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles')
        .select('*, department:departments(*)').eq('id', user.id).single()
      if (!data) { router.push('/login'); return }
      setProfile(data)
      setLoading(false)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)' }}>
      <div style={{ width:28, height:28, border:'2.5px solid var(--gold)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  )

  const initials = profile?.full_name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'U'
  const dept = (profile as any)?.department

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 232, background:'#0A0A0A',
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:50,
        borderRight:'1px solid #1C1C1C'
      }}>
        {/* Logo area */}
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #1C1C1C' }}>
          <img src={LOGO_WHITE} alt="Lighthouse Construction" style={{ height:28, width:'auto', maxWidth:160 }} />
          <div style={{ marginTop:8, fontSize:10, color:'#444', letterSpacing:'0.14em', fontWeight:500 }}>
            OPERATING SYSTEM
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
          <div style={{ fontSize:10, color:'#333', letterSpacing:'0.12em', fontWeight:600, padding:'6px 10px 8px' }}>
            MAIN MENU
          </div>
          {NAV.filter(n => !n.adminOnly || profile?.role === 'admin').map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:8, marginBottom:2,
                color: isActive ? '#000' : '#777',
                background: isActive ? 'var(--gold)' : 'transparent',
                textDecoration:'none', fontSize:13.5,
                fontWeight: isActive ? 600 : 400,
                transition:'all 0.15s ease',
              }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background='#1A1A1A'; (e.currentTarget as HTMLElement).style.color='#ccc' }}}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='#777' }}}>
                <span style={{ opacity: isActive ? 1 : 0.6, flexShrink:0 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {/* Divider */}
          <div style={{ height:1, background:'#1A1A1A', margin:'14px 0' }} />
          <div style={{ fontSize:10, color:'#333', letterSpacing:'0.12em', fontWeight:600, padding:'0 10px 8px' }}>
            WORKSPACE
          </div>
          <div style={{ padding:'8px 12px', borderRadius:8, background:'#141414', border:'1px solid #222' }}>
            <div style={{ fontSize:11, color:'#555', marginBottom:3 }}>Department</div>
            <div style={{ fontSize:13, color:'#aaa', fontWeight:500 }}>
              {dept?.name || 'Unassigned'}
            </div>
          </div>
        </nav>

        {/* User footer */}
        <div style={{ padding:'14px 12px', borderTop:'1px solid #1C1C1C' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{
              width:34, height:34, borderRadius:'50%',
              background:'var(--gold)', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700, color:'#000'
            }}>{initials}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ color:'#ddd', fontSize:12.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile?.full_name}
              </div>
              <div style={{ color:'#444', fontSize:11, marginTop:1 }}>
                {profile?.role}
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{
            width:'100%', padding:'7px', background:'transparent',
            border:'1px solid #222', borderRadius:7,
            color:'#555', fontSize:12, cursor:'pointer', transition:'all 0.15s',
            fontFamily:'inherit'
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color='#ff6b6b'; (e.target as HTMLElement).style.borderColor='#4a1a1a' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color='#555'; (e.target as HTMLElement).style.borderColor='#222' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ marginLeft:232, flex:1, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <header style={{
          height:54, background:'#fff',
          borderBottom:'1px solid var(--border-light)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', position:'sticky', top:0, zIndex:40
        }}>
          <div style={{ fontSize:13, color:'var(--mid-grey)' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--success)' }} />
              <span style={{ fontSize:12, color:'var(--mid-grey)', fontWeight:500 }}>System online</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex:1, padding:'28px 32px' }} className="fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

// ── ICONS ─────────────────────────────────────────────────────────────────────
function OverviewIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/></svg>
}
function ProjectsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="3" rx="1.5" fill="currentColor"/><rect x="1" y="6.5" width="9" height="3" rx="1.5" fill="currentColor" opacity=".6"/><rect x="1" y="12" width="12" height="3" rx="1.5" fill="currentColor" opacity=".4"/></svg>
}
function AnnIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3.5C2 2.67 2.67 2 3.5 2h9C13.33 2 14 2.67 14 3.5v7c0 .83-.67 1.5-1.5 1.5H9l-3 2v-2H3.5C2.67 14 2 13.33 2 12.5v-9Z" fill="currentColor"/></svg>
}
function PeopleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" fill="currentColor"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="5" r="2" fill="currentColor" opacity=".5"/><path d="M14 13c0-1.86-1.12-3.47-2.75-4.23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/></svg>
}
function AdminIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.5l-3.7 2 .7-4.1-3-2.9 4.2-.9L8 1Z" fill="currentColor"/></svg>
}
