'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [stats, setStats] = useState({ activeProjects:0, totalTasks:0, doneTasks:0, overdueTasks:0, teamSize:0 })
  const [projects, setProjects] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('*, department:departments(*)').eq('id', user.id).single()
    setProfile(prof)

    const today = new Date().toISOString().split('T')[0]
    const [
      { count: ap }, { count: tt }, { count: dt }, { count: ot }, { count: ts },
      { data: projs }, { data: anns }
    ] = await Promise.all([
      supabase.from('projects').select('*', { count:'exact', head:true }).eq('status','active'),
      supabase.from('tasks').select('*', { count:'exact', head:true }),
      supabase.from('tasks').select('*', { count:'exact', head:true }).eq('status','done'),
      supabase.from('tasks').select('*', { count:'exact', head:true }).neq('status','done').lt('deadline', today),
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('is_active', true),
      supabase.from('projects').select('*, department:departments(*), owner:profiles!owner_id(full_name)')
        .eq('status','active').order('updated_at', { ascending:false }).limit(6),
      supabase.from('announcements').select('*, author:profiles!author_id(full_name)')
        .order('is_pinned', { ascending:false }).order('created_at', { ascending:false }).limit(4)
    ])
    setStats({ activeProjects:ap||0, totalTasks:tt||0, doneTasks:dt||0, overdueTasks:ot||0, teamSize:ts||0 })
    setProjects(projs||[])
    setAnnouncements(anns||[])
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const KPI_CFG = [
    { label:'Active Projects', val:stats.activeProjects, icon:'◫', accent:'var(--success)', sub:'in progress' },
    { label:'Total Tasks',     val:stats.totalTasks,     icon:'☑', accent:'var(--info)',    sub:'across all projects' },
    { label:'Completed',       val:stats.doneTasks,      icon:'✓', accent:'var(--success)', sub:'tasks done' },
    { label:'Overdue',         val:stats.overdueTasks,   icon:'⚠', accent:stats.overdueTasks>0?'var(--danger)':'var(--success)', sub:'need attention', alert:stats.overdueTasks>0 },
    { label:'Team Members',    val:stats.teamSize,        icon:'◎', accent:'#7C5CBF',        sub:'active employees' },
  ]

  const PRIORITY_COLOR: Record<string, string> = { low:'var(--success)', medium:'var(--warning)', high:'#D4810A', critical:'var(--danger)' }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:700, color:'var(--charcoal)', margin:0, letterSpacing:'-0.02em' }}>
          {greeting}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--mid-grey)', fontSize:14, marginTop:5 }}>
          Here's what's happening at Lighthouse Construction today.
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
        {KPI_CFG.map(k => (
          <div key={k.label} style={{
            background: k.alert ? '#FFF5F5' : '#fff',
            border: `1px solid ${k.alert ? '#ffc9c9' : 'var(--border-light)'}`,
            borderRadius:12, padding:'18px 20px',
            borderTop: `3px solid ${k.accent}`, transition:'all 0.15s'
          }} className="card-hover">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <span style={{ fontSize:20, fontWeight:700, color: k.alert ? 'var(--danger)' : 'var(--charcoal)' }}>
                {k.val}
              </span>
              <span style={{ fontSize:16, opacity:0.4 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--charcoal)', marginBottom:2 }}>{k.label}</div>
            <div style={{ fontSize:11, color:'var(--light-grey)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>

        {/* Projects */}
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border-light)', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid var(--border-light)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, margin:0 }}>Active Projects</h2>
              <p style={{ fontSize:12, color:'var(--mid-grey)', margin:'3px 0 0' }}>
                {projects.length} running now
              </p>
            </div>
            <Link href="/dashboard/projects" style={{
              fontSize:12, color:'var(--charcoal)', textDecoration:'none', fontWeight:600,
              padding:'5px 12px', background:'var(--cream)', borderRadius:6,
              border:'1px solid var(--border-light)', transition:'all 0.15s'
            }}>View all →</Link>
          </div>

          {projects.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center', color:'var(--light-grey)', fontSize:14 }}>
              No active projects.{' '}
              <Link href="/dashboard/projects" style={{ color:'var(--gold)', textDecoration:'none' }}>Create one →</Link>
            </div>
          ) : (
            <div>
              {projects.map((p, i) => {
                const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed'
                const doneCount = p.tasks?.filter((t:any) => t.status === 'done').length || 0
                const totalCount = p.tasks?.length || 0
                return (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{
                    display:'block', padding:'14px 24px', textDecoration:'none',
                    borderBottom: i < projects.length-1 ? '1px solid var(--cream)' : 'none',
                    transition:'background 0.1s'
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='var(--cream)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background: p.department?.color || 'var(--gold)', flexShrink:0 }} />
                          <span style={{ fontSize:14, fontWeight:600, color:'var(--charcoal)' }}>{p.name}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--mid-grey)', marginTop:2, paddingLeft:16 }}>
                          {p.client || 'Internal'} · {p.department?.name || 'General'}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                        <span style={{
                          fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:500,
                          background:`${PRIORITY_COLOR[p.priority]}18`, color:PRIORITY_COLOR[p.priority]
                        }}>{p.priority}</span>
                        {p.deadline && (
                          <span style={{ fontSize:11, color: isOverdue ? 'var(--danger)' : 'var(--mid-grey)', fontWeight: isOverdue ? 600 : 400 }}>
                            {isOverdue ? '⚠ ' : ''}{format(new Date(p.deadline),'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:16 }}>
                      <div style={{ flex:1, height:5, background:'var(--cream-2)', borderRadius:10, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:10,
                          background: p.progress === 100 ? 'var(--success)' : 'var(--gold)',
                          width:`${p.progress}%`, transition:'width 0.5s ease'
                        }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--charcoal)', minWidth:32 }}>
                        {p.progress}%
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border-light)', overflow:'hidden' }}>
          <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border-light)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ fontSize:15, fontWeight:700, margin:0 }}>Announcements</h2>
            <Link href="/dashboard/announcements" style={{
              fontSize:12, color:'var(--charcoal)', textDecoration:'none', fontWeight:600,
              padding:'5px 12px', background:'var(--cream)', borderRadius:6, border:'1px solid var(--border-light)'
            }}>View all →</Link>
          </div>
          <div>
            {announcements.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--light-grey)', fontSize:14 }}>
                No announcements yet.
              </div>
            ) : announcements.map((a, i) => (
              <div key={a.id} style={{
                padding:'14px 20px',
                borderBottom: i < announcements.length-1 ? '1px solid var(--cream)' : 'none',
                borderLeft: a.is_pinned ? '3px solid var(--gold)' : '3px solid transparent'
              }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--charcoal)', marginBottom:4 }}>
                  {a.title}
                </div>
                <div style={{ fontSize:12, color:'var(--mid-grey)', lineHeight:1.5,
                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>
                  {a.body}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:7 }}>
                  <span style={{ fontSize:11, color:'var(--light-grey)' }}>{a.author?.full_name}</span>
                  <span style={{ fontSize:11, color:'var(--light-grey)' }}>{format(new Date(a.created_at),'MMM d')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
