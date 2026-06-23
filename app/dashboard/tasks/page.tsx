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
  const [departments, setDepartments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: 'All Types', status: 'All Statuses', project: '', assignee: '' })
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: prof }, { data: taskData }, { data: projectData }, { data: profileData }, { data: deptData }] = await Promise.all([
      supabase.from('profiles').select('*, department:departments(*)').eq('id', user!.id).single(),
      supabase.from('tasks').select('*, assignee:profiles!assignee_id(id, full_name), department:departments(*), project:projects(id, name)').order('deadline', { ascending: true, nullsFirst: false }),
      supabase.from('projects').select('id, name').in('status', ['planning', 'active', 'on_hold']).order('name'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
      supabase.from('departments').select('*').order('name'),
    ])
    setProfile(prof)
    setTasks(taskData || [])
    setProjects(projectData || [])
    setProfiles(profileData || [])
    setDepartments(deptData || [])
    setLoading(false)
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task? This cannot be undone.')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
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
    if (!isManagement && profile?.department_id && t.department_id !== profile.department_id) return false
    return true
  })

  const selectStyle = { padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff', cursor: 'pointer', minWidth: '140px' }

  if (loading) return <div style={{ padding: '40px', color: '#888', textAlign: 'center' }}>Loading tasks...</div>

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>
          {isManagement ? 'All Tasks' : 'My Department Tasks'}
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}{filters.status === 'overdue' ? ' — ⚠ overdue' : ''}
          {isManagement && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#B4B4B5' }}>Click any row to open task details</span>}
        </p>
      </div>

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
            Clear
          </button>
        )}
      </div>

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
                  <tr key={task.id}
                    onClick={() => setSelectedTask(task)}
                    style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #F5F3EF' : 'none',
                      background: isOverdue ? '#FFF5F5' : 'transparent', cursor: 'pointer',
                      transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isOverdue ? '#FFE5E5' : '#FAFAF9'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isOverdue ? '#FFF5F5' : 'transparent'}>
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
                      {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : <span style={{ color: '#B4B4B5' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {task.attachment_url && (
                          <a href={task.attachment_url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: '14px', color: '#FFCB1A', textDecoration: 'none' }}
                            title={task.attachment_name || 'Attachment'}>📎</a>
                        )}
                        {isManagement && (
                          <button onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B4B4B5', fontSize: '14px', padding: '2px 4px', borderRadius: '4px' }}
                            title="Delete task">🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          profiles={profiles}
          departments={departments}
          currentProfile={profile}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated: any) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
            setSelectedTask((prev: any) => ({ ...prev, ...updated }))
          }}
        />
      )}
    </div>
  )
}

// Inline TaskDetailModal copy for the tasks page
const PRIORITY_COLORS_M: Record<string, string> = { low: '#22C55E', medium: '#F59E0B', high: '#EF4444', critical: '#7C3AED' }

function TaskDetailModal({ task, profiles, departments, onClose, onUpdated, currentProfile }: {
  task: any, profiles: any[], departments: any[], onClose: () => void, onUpdated: (t: any) => void, currentProfile?: any
}) {
  const supabase = createClient()
  const isManagement = currentProfile?.role === 'admin' || currentProfile?.role === 'manager'
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    task_type: task.task_type || 'Other',
    assignee_id: task.assignee_id || '',
    department_id: task.department_id || '',
    deadline: task.deadline ? task.deadline.split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  async function save() {
    setSaving(true)
    let attachment_url = task.attachment_url
    let attachment_name = task.attachment_name
    if (attachFile && isManagement) {
      setUploading(true)
      const ext = attachFile.name.split('.').pop()
      const path = `tasks/${task.project_id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('lhc-documents').upload(path, attachFile)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('lhc-documents').getPublicUrl(path)
        attachment_url = publicUrl
        attachment_name = attachFile.name
      }
      setUploading(false)
    }
    const updates = isManagement
      ? { ...form, attachment_url, attachment_name, assignee_id: form.assignee_id || null, department_id: form.department_id || null, deadline: form.deadline || null }
      : { status: form.status }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    onUpdated({ ...task, ...updates, attachment_url, attachment_name })
    setSaving(false)
  }

  const inputStyle = { width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 500 as const, color: '#505151', marginBottom: '6px' }
  const readOnlyStyle = { ...inputStyle, background: '#FAFAF9', cursor: 'default' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '620px',
        maxHeight: '90vh', overflow: 'auto' }}>

        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              background: `${PRIORITY_COLORS_M[form.priority]}15`, color: PRIORITY_COLORS_M[form.priority] }}>{form.priority}</span>
            {form.task_type !== 'Other' && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#E8E4DE', color: '#505151' }}>{form.task_type}</span>}
            {isOverdue && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#FEE2E2', color: '#EF4444' }}>⚠ Overdue</span>}
            {task.project?.name && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: '#E8E4DE', color: '#505151' }}>{task.project.name}</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888', padding: '0 0 0 16px' }}>×</button>
        </div>

        <div style={{ padding: '12px 28px 0' }}>
          <input value={form.title} onChange={e => isManagement && setForm(p => ({ ...p, title: e.target.value }))}
            readOnly={!isManagement}
            style={{ width: '100%', fontSize: '20px', fontWeight: 700, border: 'none', outline: 'none',
              padding: '0', color: '#1A1A1A', boxSizing: 'border-box' as const,
              cursor: isManagement ? 'text' : 'default', background: 'transparent' }} />
        </div>

        <div style={{ padding: '20px 28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => isManagement && setForm(p => ({ ...p, description: e.target.value }))}
              readOnly={!isManagement}
              placeholder={isManagement ? 'Add a description...' : 'No description.'}
              style={{ ...inputStyle, resize: isManagement ? 'vertical' : 'none', fontFamily: 'inherit',
                background: isManagement ? '#fff' : '#FAFAF9' }} />
          </div>

          {(task.attachment_url || isManagement) && (
            <div style={{ marginBottom: '20px', padding: '16px', background: '#FAFAF9', borderRadius: '10px', border: '0.5px solid #E8E6E3' }}>
              <label style={labelStyle}>Attachment</label>
              {task.attachment_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isManagement ? '10px' : '0' }}>
                  <span style={{ fontSize: '18px' }}>📎</span>
                  <a href={task.attachment_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '14px', color: '#FFCB1A', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid #FFCB1A' }}>
                    {task.attachment_name || 'View Attachment'}
                  </a>
                </div>
              ) : <p style={{ fontSize: '13px', color: '#888', margin: '0 0 10px' }}>No attachment yet.</p>}
              {isManagement && (
                <>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg"
                    onChange={e => setAttachFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '13px', width: '100%' }} />
                  {attachFile && <p style={{ fontSize: '12px', color: '#505151', margin: '6px 0 0' }}>📎 {attachFile.name}</p>}
                </>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              {isManagement ? (
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </select>
              ) : <div style={{ ...readOnlyStyle, color: PRIORITY_COLORS_M[form.priority], fontWeight: 600 }}>{form.priority}</div>}
            </div>
            <div>
              <label style={labelStyle}>Task Type</label>
              {isManagement ? (
                <select value={form.task_type} onChange={e => setForm(p => ({ ...p, task_type: e.target.value }))} style={inputStyle}>
                  {['BOQ','Contract','Drawing','Other','Photo','Site Report','Submittal','Tender Offer'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : <div style={readOnlyStyle}>{form.task_type}</div>}
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              {isManagement ? (
                <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} style={inputStyle} />
              ) : <div style={readOnlyStyle}>{form.deadline || 'No deadline'}</div>}
            </div>
            <div>
              <label style={labelStyle}>Assigned To</label>
              {isManagement ? (
                <select value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              ) : <div style={readOnlyStyle}>{profiles.find((p: any) => p.id === form.assignee_id)?.full_name || 'Unassigned'}</div>}
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              {isManagement ? (
                <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))} style={inputStyle}>
                  <option value="">None</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              ) : <div style={readOnlyStyle}>{departments.find((d: any) => d.id === form.department_id)?.name || 'None'}</div>}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '0.5px solid #E8E6E3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!isManagement && <span style={{ fontSize: '12px', color: '#888' }}>You can update the status of this task.</span>}
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', border: '0.5px solid #E8E6E3', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving || uploading}
              style={{ padding: '9px 24px', background: '#FFCB1A', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
              {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
