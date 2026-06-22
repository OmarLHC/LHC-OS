'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, isPast } from 'date-fns'

const TASK_TYPES = ['All Types', 'BOQ', 'Contract', 'Drawing', 'Other', 'Photo', 'Site Report', 'Submittal', 'Tender Offer']
const STATUSES = ['All Statuses', 'todo', 'in_progress', 'review', 'done', 'overdue']
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', overdue: 'Overdue' }
const STATUS_COLORS: Record<string, string> = { todo: '#B4B4B5', in_progress: '#3B82F6', review: '#F59E0B', done: '#22C55E', overdue: '#EF4444' }
const PRIORITY_COLORS: Record<string, string> = { low: '#22C55E', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED' }

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: 'All Types', status: 'All Statuses', project: '', assignee: '' })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: prof }, { data: taskData }, { data: projectData }, { data: profileData }] = await Promise.all([
      supabase.from('profiles').select('*, department:departments(*)').eq('id', user!.id).single(),
      supabase.from('tasks').select('*, assignee:profiles!assignee_id(id, full_name), department:departments(*), project:projects(id, name)').order('deadline', { ascending: true, nullsFirst: false }),
      supabase.from('projects').select('id, name').in('status', ['planning', 'active', 'on_hold']).order('name'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
    ])
    setProfile(prof)
    setTasks(taskData || [])
    setProjects(projectData || [])
    setProfiles(profileData || [])
    setLoading(false)
  }

  const isManagement = profile?.role === 'admin' || profile?.role === 'manager'

  const filtered = tasks.filter(t => {
    const isOverdue = t.deadline && isPast(new Date(t.deadline)) && t.status !== 'done'
    if (filters.type !== 'All Types' && t.task_type !== filters.type) return false
    if (filters.status !== 'All Statuses') {
      if (filters.status === 'overdue' && !isOverdue) return false
      if (filters.status !== 'overdue' && t.status !== filters.status) return false
    }
    if (filters.project && t.project_id !== filters.project) return false
    if (filters.assignee && t.assignee_id !== filters.assignee) return false
    // Dept filtering for non-management
    if (!isManagement && profile?.department_id && t.department_id !== profile.department_id) return false
    return true
  })

  const selectStyle = { padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff', cursor: 'pointer', minWidth: '140px' }

  if (loading) return <div style={{ padding: '40px', color: '#888', textAlign: 'center' }}>Loading tasks...</div>

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>
          {isManagement ? 'All Tasks' : 'My Department Tasks'}
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''} {filters.status === 'overdue' ? '— ⚠ overdue' : ''}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} style={selectStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All Statuses' ? 'All Statuses' : STATUS_LABELS[s] || s}</option>)}
        </select>
        <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))} style={selectStyle}>
          {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {isManagement && (
          <select value={filters.project} onChange={e => setFilters(p => ({ ...p, project: e.target.value }))} style={selectStyle}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {isManagement && (
          <select value={filters.assignee} onChange={e => setFilters(p => ({ ...p, assignee: e.target.value }))} style={selectStyle}>
            <option value="">All Assignees</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        )}
        {(filters.status !== 'All Statuses' || filters.type !== 'All Types' || filters.project || filters.assignee) && (
          <button onClick={() => setFilters({ type: 'All Types', status: 'All Statuses', project: '', assignee: '' })}
            style={{ padding: '8px 14px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff', cursor: 'pointer', color: '#888' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#888', border: '0.5px solid #E8E6E3' }}>
          No tasks match the selected filters.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E8E6E3', background: '#FAFAF9' }}>
                {['Project', 'Task', 'Type', 'Assignee', 'Status', 'Priority', 'Deadline', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => {
                const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'done'
                return (
                  <tr key={task.id} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #F5F3EF' : 'none', background: isOverdue ? '#FFF5F5' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151', maxWidth: '160px' }}>
                      <span style={{ fontWeight: 500 }}>{task.project?.name || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '220px' }}>
                      <div style={{ fontWeight: 500, color: '#1A1A1A' }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {task.task_type && (
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: '#E8E4DE', color: '#505151', whiteSpace: 'nowrap' }}>
                          {task.task_type}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>
                      {task.assignee?.full_name || <span style={{ color: '#B4B4B5' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: `${STATUS_COLORS[isOverdue ? 'overdue' : task.status]}15`,
                        color: STATUS_COLORS[isOverdue ? 'overdue' : task.status] }}>
                        {isOverdue ? 'Overdue' : STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: isOverdue ? '#EF4444' : '#505151', fontWeight: isOverdue ? 600 : 400, whiteSpace: 'nowrap' }}>
                      {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : <span style={{ color: '#B4B4B5' }}>No deadline</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {task.attachment_url && (
                        <a href={task.attachment_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '13px', color: '#FFCB1A', textDecoration: 'none' }}
                          title={task.attachment_name || 'Attachment'}>
                          📎
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
