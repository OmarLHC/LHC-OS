'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const WEATHER = ['Clear', 'Cloudy', 'Windy', 'Hot', 'Rainy', 'Sandstorm']
const TRADES = ['Civil', 'MEP', 'Finishing', 'Steel', 'Gypsum', 'Marble', 'Electrical', 'Plumbing', 'Carpentry', 'Other']

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [showNew, setShowNew] = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('*, department:departments(*)').eq('id', user.id).single()
    setProfile(prof)
    const [{ data: reps }, { data: projs }] = await Promise.all([
      supabase.from('site_reports').select('*, project:projects(name,id), submitter:profiles!submitted_by(full_name)').order('report_date', { ascending: false }).limit(100),
      supabase.from('projects').select('id,name').eq('status', 'active').order('name')
    ])
    setReports(reps || [])
    setProjects(projs || [])
    setLoading(false)
  }

  async function markReviewed(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('site_reports').update({ status: 'reviewed', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const filtered = reports.filter(r =>
    (!filterProject || r.project_id === filterProject) &&
    (!filterType || r.report_type === filterType)
  )

  const isManagement = profile?.role === 'admin' || profile?.role === 'manager'
  const canSubmit = isManagement || (profile as any)?.department?.name === 'Site / Operations'

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Site Reports</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{filtered.length} reports</p>
        </div>
        {canSubmit && (
          <button onClick={() => setShowNew(true)} style={{ padding: '9px 18px', background: '#FFCB1A', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
            + New Report
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
          <option value="">Daily & Weekly</option>
          <option value="daily">Daily only</option>
          <option value="weekly">Weekly only</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#B4B4B5', background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3' }}>
            No reports yet. {canSubmit && <span style={{ color: '#FFCB1A', cursor: 'pointer' }} onClick={() => setShowNew(true)}>Submit the first one →</span>}
          </div>
        ) : filtered.map(r => <ReportCard key={r.id} report={r} isManagement={isManagement} onReview={markReviewed} />)}
      </div>

      {showNew && <NewReportModal projects={projects} profile={profile} onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  )
}

function ReportCard({ report, isManagement, onReview }: any) {
  const [expanded, setExpanded] = useState(false)
  const manpower = report.manpower_breakdown || []
  const isReviewed = report.status === 'reviewed'

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${isReviewed ? '#E8E6E3' : '#FFCB1A'}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'center', background: '#F5F4F1', borderRadius: '8px', padding: '6px 12px', minWidth: '48px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>{format(new Date(report.report_date), 'd')}</div>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>{format(new Date(report.report_date), 'MMM yy')}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{report.project?.name}</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: report.report_type === 'weekly' ? '#E6F1FB' : '#E1F5EE', color: report.report_type === 'weekly' ? '#185FA5' : '#0F6E56' }}>
                {report.report_type}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              {report.submitter?.full_name} · <strong>{report.total_manpower}</strong> workers{report.weather ? ` · ${report.weather}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isReviewed ? (
            <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: '#E1F5EE', color: '#0F6E56' }}>✓ Reviewed</span>
          ) : isManagement ? (
            <button onClick={e => { e.stopPropagation(); onReview(report.id) }}
              style={{ padding: '5px 12px', background: '#FFCB1A', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#000' }}>
              Mark Reviewed
            </button>
          ) : (
            <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', background: '#FFF3CD', color: '#856404' }}>Pending Review</span>
          )}
          <span style={{ color: '#B4B4B5' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px 20px 20px', borderTop: '0.5px solid #F0EEEB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Work Completed', value: report.work_completed },
              { label: 'Planned Tomorrow', value: report.work_planned },
              { label: 'Materials Received', value: report.materials_received },
              { label: 'Materials Pending', value: report.materials_pending },
              { label: 'Issues', value: report.issues },
              { label: 'Blockers', value: report.blockers },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', letterSpacing: '0.06em', marginBottom: '4px' }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize: '13px', color: '#1A1A1A', lineHeight: 1.5 }}>{f.value}</div>
              </div>
            ))}
          </div>
          {manpower.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', letterSpacing: '0.06em', marginBottom: '8px' }}>MANPOWER BREAKDOWN</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {manpower.map((m: any, i: number) => (
                  <span key={i} style={{ padding: '4px 12px', background: '#F5F4F1', borderRadius: '6px', fontSize: '12px' }}>
                    {m.trade}: <strong>{m.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewReportModal({ projects, profile, onClose, onCreated }: any) {
  const [form, setForm] = useState({
    project_id: '', report_type: 'daily',
    report_date: new Date().toISOString().split('T')[0],
    total_manpower: '', weather: '',
    work_completed: '', work_planned: '',
    materials_received: '', materials_pending: '',
    issues: '', blockers: ''
  })
  const [manpower, setManpower] = useState<{ trade: string; count: string }[]>([{ trade: '', count: '' }])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const mb = manpower.filter(m => m.trade && m.count).map(m => ({ trade: m.trade, count: parseInt(m.count) }))
    await supabase.from('site_reports').insert({
      project_id: form.project_id, submitted_by: user?.id,
      report_type: form.report_type, report_date: form.report_date,
      total_manpower: parseInt(form.total_manpower) || 0,
      weather: form.weather || null, work_completed: form.work_completed || null,
      work_planned: form.work_planned || null, materials_received: form.materials_received || null,
      materials_pending: form.materials_pending || null, issues: form.issues || null,
      blockers: form.blockers || null, manpower_breakdown: mb
    })
    onCreated(); onClose()
  }

  const inp = (label: string, key: string, type = 'text') => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px', letterSpacing: '0.05em' }}>{label}</label>
      {type === 'textarea' ? (
        <textarea rows={2} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' as any, fontFamily: 'inherit' }} />
      ) : (
        <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any, fontFamily: 'inherit' }} />
      )}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflow: 'auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>New Site Report</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>PROJECT *</label>
              <select required value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px' }}>
                <option value="">Select project</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>TYPE</label>
              <select value={form.report_type} onChange={e => setForm(p => ({ ...p, report_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px' }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', margin: '10px 0' }}>
            {inp('Date *', 'report_date', 'date')}
            {inp('Total Workers', 'total_manpower', 'number')}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>WEATHER</label>
              <select value={form.weather} onChange={e => setForm(p => ({ ...p, weather: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px' }}>
                <option value="">Select</option>
                {WEATHER.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '8px', letterSpacing: '0.05em' }}>MANPOWER BY TRADE</div>
            {manpower.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <select value={m.trade} onChange={e => { const n = [...manpower]; n[i].trade = e.target.value; setManpower(n) }}
                  style={{ flex: 2, padding: '7px 10px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px' }}>
                  <option value="">Trade</option>
                  {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" min="0" placeholder="Count" value={m.count}
                  onChange={e => { const n = [...manpower]; n[i].count = e.target.value; setManpower(n) }}
                  style={{ flex: 1, padding: '7px 10px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px' }} />
                <button type="button" onClick={() => setManpower(manpower.filter((_, j) => j !== i))}
                  style={{ padding: '7px 10px', border: '0.5px solid #E8E6E3', borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#888' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setManpower([...manpower, { trade: '', count: '' }])}
              style={{ fontSize: '12px', color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>+ Add trade</button>
          </div>

          {inp('Work Completed Today', 'work_completed', 'textarea')}
          {inp('Planned for Tomorrow', 'work_planned', 'textarea')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>{inp('Materials Received', 'materials_received', 'textarea')}</div>
            <div>{inp('Materials Pending', 'materials_pending', 'textarea')}</div>
            <div>{inp('Issues', 'issues', 'textarea')}</div>
            <div>{inp('Blockers', 'blockers', 'textarea')}</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '0.5px solid #E8E6E3', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: '#FFCB1A', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#000', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
