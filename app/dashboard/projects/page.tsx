'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Project, Department, Profile } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', active: 'Active', on_hold: 'On Hold',
  completed: 'Completed', cancelled: 'Cancelled'
}
const STATUS_COLORS: Record<string, [string, string]> = {
  planning: ['#E6F1FB', '#185FA5'], active: ['#E1F5EE', '#0F6E56'],
  on_hold: ['#FAEEDA', '#854F0B'], completed: ['#EAF3DE', '#3B6D11'],
  cancelled: ['#FCEBEB', '#A32D2D']
}
const PRIORITY_COLORS: Record<string, string> = {
  low: '#0F6E56', medium: '#854F0B', high: '#993C1D', critical: '#A32D2D'
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: projs }, { data: depts }] = await Promise.all([
      supabase.from('projects').select(`
        *, department:departments(*), owner:profiles!owner_id(full_name, id),
        tasks(id, status)
      `).order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name')
    ])
    setProjects(projs || [])
    setDepartments(depts || [])
    setLoading(false)
  }

  const filtered = projects.filter(p =>
    (!filterDept || p.department_id === filterDept) &&
    (!filterStatus || p.status === filterStatus)
  )

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Projects</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{
          padding: '9px 18px', background: '#FFCB1A', border: 'none',
          borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          color: '#000', letterSpacing: '0.03em'
        }}>+ New Project</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px',
            fontSize: '13px', background: '#fff', color: '#1A1A1A' }}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px',
            fontSize: '13px', background: '#fff', color: '#1A1A1A' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Projects grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.map(project => {
          const taskCount = project.tasks?.length || 0
          const doneCount = project.tasks?.filter((t: any) => t.status === 'done').length || 0
          const [bgColor, textColor] = STATUS_COLORS[project.status] || ['#F5F4F1', '#505151']
          const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed'

          return (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}
              style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3',
                overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer'
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#FFCB1A'; el.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E8E6E3'; el.style.transform = 'none' }}>
                {/* Top color strip based on department */}
                <div style={{ height: '4px', background: project.department?.color || '#FFCB1A' }} />
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: 0, flex: 1, paddingRight: '12px' }}>
                      {project.name}
                    </h3>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                      background: bgColor, color: textColor, whiteSpace: 'nowrap' }}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  {project.client && (
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                      Client: {project.client}
                    </div>
                  )}
                  {project.department && (
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                      {project.department.name}
                    </div>
                  )}

                  {/* Progress */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>{doneCount}/{taskCount} tasks</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>{project.progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#F0EEEB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: project.progress === 100 ? '#1D9E75' : '#FFCB1A',
                        width: `${project.progress}%`
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                      background: `${PRIORITY_COLORS[project.priority]}15`,
                      color: PRIORITY_COLORS[project.priority]
                    }}>{project.priority}</span>
                    {project.deadline && (
                      <span style={{ fontSize: '12px', color: isOverdue ? '#A32D2D' : '#888', fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue ? '⚠ ' : ''}Due {format(new Date(project.deadline), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#B4B4B5' }}>
            No projects found. <button onClick={() => setShowNew(true)}
              style={{ background: 'none', border: 'none', color: '#FFCB1A', cursor: 'pointer', fontSize: 'inherit' }}>
              Create the first one →
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNew && <NewProjectModal departments={departments} onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  )
}

function NewProjectModal({ departments, onClose, onCreated }: {
  departments: Department[], onClose: () => void, onCreated: () => void
}) {
  const [form, setForm] = useState({ name: '', client: '', description: '', department_id: '', priority: 'medium', status: 'planning', deadline: '', start_date: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('projects').insert({
      ...form,
      owner_id: user?.id,
      department_id: form.department_id || null,
      deadline: form.deadline || null,
      start_date: form.start_date || null,
    })
    onCreated()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflow: 'auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>New Project</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={submit}>
          {[
            { label: 'Project Name *', key: 'name', type: 'text', required: true },
            { label: 'Client', key: 'client', type: 'text' },
            { label: 'Start Date', key: 'start_date', type: 'date' },
            { label: 'Deadline', key: 'deadline', type: 'date' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>{f.label}</label>
              <input type={f.type} required={f.required} value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3',
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Department</label>
              <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3',
                borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '0.5px solid #E8E6E3',
              borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: '#FFCB1A',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
