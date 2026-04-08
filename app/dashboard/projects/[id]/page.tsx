'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Task, Profile, Department } from '@/lib/types'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#B4B4B5' },
  { id: 'in_progress', label: 'In Progress',  color: '#185FA5' },
  { id: 'review',      label: 'Review',       color: '#854F0B' },
  { id: 'done',        label: 'Done',         color: '#0F6E56' },
]
const PRIORITY_COLORS: Record<string, string> = {
  low: '#0F6E56', medium: '#854F0B', high: '#993C1D', critical: '#A32D2D'
}

export default function ProjectPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [view, setView] = useState<'kanban' | 'list' | 'gantt'>('kanban')
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskCol, setNewTaskCol] = useState('todo')
  const [dragTask, setDragTask] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    const [{ data: proj }, { data: taskData }, { data: memberData }, { data: profiles }, { data: depts }] = await Promise.all([
      supabase.from('projects').select('*, department:departments(*), owner:profiles!owner_id(*)').eq('id', id).single(),
      supabase.from('tasks').select('*, assignee:profiles!assignee_id(id, full_name, avatar_url), department:departments(*)').eq('project_id', id).order('sort_order'),
      supabase.from('project_members').select('user:profiles!user_id(*)').eq('project_id', id),
      supabase.from('profiles').select('id, full_name, email, avatar_url').eq('is_active', true).order('full_name'),
      supabase.from('departments').select('*').order('name'),
    ])
    setProject(proj)
    setTasks(taskData || [])
    setMembers(memberData?.map((m: any) => m.user) || [])
    setAllProfiles((profiles || []) as any)
    setDepartments(depts || [])
  }

  async function moveTask(taskId: string, newStatus: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    // Refresh project to get updated progress
    const { data } = await supabase.from('projects').select('progress').eq('id', id).single()
    if (data) setProject((p: any) => ({ ...p, progress: data.progress }))
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const STATUS_LABELS: Record<string, string> = {
    planning: 'Planning', active: 'Active', on_hold: 'On Hold',
    completed: 'Completed', cancelled: 'Cancelled'
  }

  if (!project) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  const tasksByCol = (colId: string) => tasks.filter(t => t.status === colId)
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.push('/dashboard/projects')}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Projects
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{project.name}</h1>
            {project.client && <div style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>Client: {project.client}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => { setNewTaskCol('todo'); setShowNewTask(true) }}
              style={{ padding: '8px 16px', background: '#FFCB1A', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
              + Add Task
            </button>
            <button onClick={() => setView(v => v === 'kanban' ? 'list' : 'kanban')}
              style={{ padding: '8px 14px', background: '#fff', border: '0.5px solid #E8E6E3',
                borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#1A1A1A' }}>
              {view === 'kanban' ? 'List view' : 'Board view'}
            </button>
          </div>
        </div>

        {/* Project meta */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', borderRadius: '10px', border: '0.5px solid #E8E6E3',
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>PROGRESS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '120px', height: '8px', background: '#F0EEEB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: project.progress === 100 ? '#1D9E75' : '#FFCB1A',
                    width: `${project.progress}%`, borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{project.progress}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>STATUS</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{STATUS_LABELS[project.status]}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>DEPARTMENT</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{project.department?.name || '—'}</div>
            </div>
            {project.deadline && (
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>DEADLINE</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isOverdue ? '#A32D2D' : '#1A1A1A' }}>
                  {isOverdue ? '⚠ ' : ''}{format(new Date(project.deadline), 'MMM d, yyyy')}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>TASKS</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                {tasks.filter(t => t.status === 'done').length}/{tasks.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', alignItems: 'start' }}>
          {COLUMNS.map(col => (
            <div key={col.id}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drag-over') }}
              onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
              onDrop={async e => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.remove('drag-over')
                if (dragTask) { await moveTask(dragTask, col.id); setDragTask(null) }
              }}
              style={{ background: '#F5F4F1', borderRadius: '12px', padding: '12px',
                border: '1.5px solid transparent', transition: 'border-color 0.15s, background 0.15s' }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{col.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#E8E6E3', borderRadius: '10px', padding: '1px 7px',
                    fontSize: '11px', fontWeight: 600, color: '#505151' }}>
                    {tasksByCol(col.id).length}
                  </span>
                  <button onClick={() => { setNewTaskCol(col.id); setShowNewTask(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B4B4B5',
                      fontSize: '18px', padding: '0', lineHeight: 1 }}>+</button>
                </div>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasksByCol(col.id).map(task => (
                  <TaskCard key={task.id} task={task} onDelete={deleteTask}
                    onMove={moveTask} dragStart={() => setDragTask(task.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E8E6E3', background: '#FAFAF8' }}>
                {['Task', 'Status', 'Priority', 'Assignee', 'Department', 'Deadline', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px',
                    fontWeight: 600, color: '#505151', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => {
                const [bg, tc] = ({ todo: ['#F5F4F1','#505151'], in_progress: ['#E6F1FB','#185FA5'], review: ['#FAEEDA','#854F0B'], done: ['#E1F5EE','#0F6E56'] } as any)[task.status]
                const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
                return (
                  <tr key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '0.5px solid #F0EEEB' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#1A1A1A', maxWidth: '280px' }}>
                      {task.title}
                      {task.description && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{task.description}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={task.status} onChange={e => moveTask(task.id, e.target.value)}
                        style={{ padding: '3px 8px', borderRadius: '4px', border: 'none',
                          background: bg, color: tc, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>
                      {(task.assignee as any)?.full_name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>
                      {(task.department as any)?.name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px',
                      color: overdue ? '#A32D2D' : '#888', fontWeight: overdue ? 600 : 400 }}>
                      {task.deadline ? format(new Date(task.deadline), 'MMM d') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => deleteTask(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          color: '#B4B4B5', fontSize: '16px', padding: '0 4px' }}>×</button>
                    </td>
                  </tr>
                )
              })}
              {tasks.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#B4B4B5', fontSize: '14px' }}>
                  No tasks yet. Add the first one.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <NewTaskModal
          projectId={id as string} defaultStatus={newTaskCol}
          profiles={allProfiles} departments={departments}
          onClose={() => setShowNewTask(false)} onCreated={load}
        />
      )}
    </div>
  )
}

function TaskCard({ task, onDelete, onMove, dragStart }: {
  task: Task, onDelete: (id: string) => void, onMove: (id: string, status: string) => void, dragStart: () => void
}) {
  const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
  const initials = (task.assignee as any)?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2) || ''

  return (
    <div draggable onDragStart={dragStart}
      style={{ background: '#fff', borderRadius: '8px', border: '0.5px solid #E8E6E3',
        padding: '12px', cursor: 'grab', transition: 'box-shadow 0.1s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', flex: 1, paddingRight: '8px', lineHeight: 1.4 }}>
          {task.title}
        </div>
        <button onClick={() => onDelete(task.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B4B4B5',
            fontSize: '16px', padding: '0', lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
      {task.description && (
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any }}>
          {task.description}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 500,
            background: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
            {task.priority}
          </span>
          {(task.department as any)?.name && (
            <span style={{ fontSize: '10px', color: '#B4B4B5' }}>{(task.department as any).name}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.deadline && (
            <span style={{ fontSize: '10px', color: overdue ? '#A32D2D' : '#B4B4B5', fontWeight: overdue ? 600 : 400 }}>
              {overdue ? '⚠ ' : ''}{format(new Date(task.deadline), 'MMM d')}
            </span>
          )}
          {initials && (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFCB1A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, color: '#000' }}>
              {initials}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewTaskModal({ projectId, defaultStatus, profiles, departments, onClose, onCreated }: {
  projectId: string, defaultStatus: string, profiles: Profile[], departments: Department[],
  onClose: () => void, onCreated: () => void
}) {
  const [form, setForm] = useState({ title: '', description: '', status: defaultStatus, priority: 'medium', assignee_id: '', department_id: '', deadline: '', estimated_hours: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tasks').insert({
      project_id: projectId, title: form.title, description: form.description || null,
      status: form.status, priority: form.priority,
      assignee_id: form.assignee_id || null, department_id: form.department_id || null,
      deadline: form.deadline || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      created_by: user?.id
    })
    onCreated()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflow: 'auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>New Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Task Title *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Status', key: 'status', options: COLUMNS.map(c => ({ v: c.id, l: c.label })) },
              { label: 'Priority', key: 'priority', options: [{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }, { v: 'critical', l: 'Critical' }] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>{f.label}</label>
                <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                  {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Assign To</label>
              <select value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Unassigned</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Department</label>
              <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Est. Hours</label>
              <input type="number" min="0" step="0.5" value={form.estimated_hours}
                onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '0.5px solid #E8E6E3',
              borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: '#FFCB1A',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function GanttView({ tasks, project }: { tasks: any[], project: any }) {
  if (!tasks.length) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#B4B4B5' }}>No tasks with deadlines to show on timeline.</div>
  )

  const tasksWithDates = tasks.filter(t => t.deadline)
  if (!tasksWithDates.length) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#B4B4B5' }}>Add deadlines to tasks to see the Gantt timeline.</div>
  )

  const allDates = tasksWithDates.map(t => new Date(t.deadline))
  const startDate = project.start_date ? new Date(project.start_date) : new Date(Math.min(...allDates.map(d => d.getTime())))
  const endDate = project.deadline ? new Date(project.deadline) : new Date(Math.max(...allDates.map(d => d.getTime())))
  const totalDays = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 1)

  const STATUS_COLORS: Record<string, string> = {
    todo: '#B4B4B5', in_progress: '#FFCB1A', review: '#185FA5', done: '#0F6E56'
  }

  // Generate week markers
  const weeks: { label: string; left: number }[] = []
  const cur = new Date(startDate)
  while (cur <= endDate) {
    const left = ((cur.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100
    weeks.push({ label: format(cur, 'MMM d'), left })
    cur.setDate(cur.getDate() + 7)
  }

  const today = new Date()
  const todayLeft = ((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '600px' }}>
        {/* Week labels */}
        <div style={{ position: 'relative', height: '28px', marginBottom: '4px', marginLeft: '200px' }}>
          {weeks.map((w, i) => (
            <div key={i} style={{ position: 'absolute', left: `${w.left}%`, fontSize: '11px', color: '#B4B4B5', whiteSpace: 'nowrap' }}>{w.label}</div>
          ))}
        </div>
        {/* Tasks */}
        {tasksWithDates.map(task => {
          const deadlineDate = new Date(task.deadline)
          const taskStart = task.created_at ? new Date(task.created_at) : startDate
          const left = Math.max(0, ((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100)
          const right = Math.min(100, ((deadlineDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100)
          const width = Math.max(right - left, 1)
          const isOverdue = deadlineDate < today && task.status !== 'done'
          const color = isOverdue ? '#C0392B' : STATUS_COLORS[task.status] || '#B4B4B5'
          return (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', height: '32px' }}>
              <div style={{ width: '200px', flexShrink: 0, fontSize: '12px', color: '#1A1A1A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>
                {task.title}
              </div>
              <div style={{ flex: 1, position: 'relative', height: '24px', background: '#F5F4F1', borderRadius: '6px' }}>
                <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: '100%', background: color, borderRadius: '6px', opacity: task.status === 'done' ? 0.5 : 1, transition: 'width 0.3s ease' }} />
                {todayLeft >= 0 && todayLeft <= 100 && (
                  <div style={{ position: 'absolute', left: `${todayLeft}%`, top: '-4px', bottom: '-4px', width: '2px', background: '#C0392B', borderRadius: '2px' }} />
                )}
              </div>
              <div style={{ width: '70px', flexShrink: 0, fontSize: '11px', color: isOverdue ? '#C0392B' : '#888', textAlign: 'right', paddingLeft: '10px', fontWeight: isOverdue ? 600 : 400 }}>
                {format(deadlineDate, 'MMM d')}
              </div>
            </div>
          )
        })}
        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', marginLeft: '200px' }}>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: v }} />
              {k.replace('_', ' ')}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#C0392B' }}>
            <div style={{ width: '2px', height: '12px', background: '#C0392B', borderRadius: '2px' }} />
            today
          </div>
        </div>
      </div>
    </div>
  )
}
