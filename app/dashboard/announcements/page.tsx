'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Department } from '@/lib/types'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: prof }, { data: ann }, { data: depts }] = await Promise.all([
      supabase.from('profiles').select('*, department:departments(*)').eq('id', user!.id).single(),
      supabase.from('announcements').select('*, author:profiles!author_id(full_name, id), department:departments(name)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name')
    ])
    setProfile(prof)
    setAnnouncements(ann || [])
    setDepartments(depts || [])

    // Mark visible ones as read
    if (user && ann) {
      const ids = ann.map((a: any) => a.id)
      const reads = ids.map((id: string) => ({ announcement_id: id, user_id: user.id }))
      await supabase.from('announcement_reads').upsert(reads, { onConflict: 'announcement_id,user_id', ignoreDuplicates: true })
    }
    setLoading(false)
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from('announcements').update({ is_pinned: !pinned }).eq('id', id)
    load()
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    load()
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Announcements</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Company-wide and department communications
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowNew(true)} style={{
            padding: '9px 18px', background: '#FFCB1A', border: 'none',
            borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#000'
          }}>+ Post Announcement</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#B4B4B5', background: '#fff',
            borderRadius: '12px', border: '0.5px solid #E8E6E3' }}>
            No announcements yet.
          </div>
        ) : announcements.map(ann => (
          <div key={ann.id} style={{
            background: '#fff', borderRadius: '12px', border: `0.5px solid ${ann.is_pinned ? '#FFCB1A' : '#E8E6E3'}`,
            padding: '20px 24px', position: 'relative',
            borderLeft: ann.is_pinned ? '4px solid #FFCB1A' : '0.5px solid #E8E6E3'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {ann.is_pinned && <span style={{ fontSize: '12px', background: '#FAEEDA', color: '#854F0B',
                    padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>📌 Pinned</span>}
                  {ann.audience === 'department' && ann.department && (
                    <span style={{ fontSize: '12px', background: '#E6F1FB', color: '#185FA5',
                      padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                      {ann.department.name}
                    </span>
                  )}
                  {ann.email_sent && <span style={{ fontSize: '12px', background: '#E1F5EE', color: '#0F6E56',
                    padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>✉ Emailed</span>}
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px', color: '#1A1A1A' }}>
                  {ann.title}
                </h2>
                <p style={{ fontSize: '14px', color: '#505151', lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                  {ann.body}
                </p>
                <div style={{ fontSize: '12px', color: '#B4B4B5' }}>
                  Posted by <strong style={{ color: '#888' }}>{ann.author?.full_name}</strong>
                  {' · '}{format(new Date(ann.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </div>
              </div>
              {(isAdmin || ann.author?.id === profile?.id) && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                  <button onClick={() => togglePin(ann.id, ann.is_pinned)}
                    style={{ padding: '5px 10px', border: '0.5px solid #E8E6E3', borderRadius: '6px',
                      background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#888' }}>
                    {ann.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => deleteAnnouncement(ann.id)}
                    style={{ padding: '5px 10px', border: '0.5px solid #F09595', borderRadius: '6px',
                      background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#A32D2D' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNew && <NewAnnouncementModal departments={departments} profile={profile}
        onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  )
}

function NewAnnouncementModal({ departments, profile, onClose, onCreated }: {
  departments: Department[], profile: any, onClose: () => void, onCreated: () => void
}) {
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', department_id: '', sendEmail: true })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: ann, error } = await supabase.from('announcements').insert({
      title: form.title, body: form.body, author_id: profile.id,
      audience: form.audience, department_id: form.department_id || null,
    }).select().single()

    if (!error && ann && form.sendEmail) {
      // Call our email API
      await fetch('/api/announcements/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: ann.id })
      })
      await supabase.from('announcements').update({ email_sent: true }).eq('id', ann.id)
    }
    onCreated()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflow: 'auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>New Announcement</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Title *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="What's the announcement about?"
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3',
                borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Message *</label>
            <textarea required rows={5} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your announcement here..."
              style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3',
                borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Audience</label>
              <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="all">Everyone</option>
                <option value="department">Specific Department</option>
              </select>
            </div>
            {form.audience === 'department' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Department</label>
                <select required={form.audience === 'department'} value={form.department_id}
                  onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px', background: '#F5F4F1', borderRadius: '8px' }}>
            <input type="checkbox" id="sendEmail" checked={form.sendEmail}
              onChange={e => setForm(p => ({ ...p, sendEmail: e.target.checked }))}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="sendEmail" style={{ fontSize: '13px', color: '#505151', cursor: 'pointer' }}>
              Send email notification to recipients
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '0.5px solid #E8E6E3',
              borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: '#FFCB1A',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
              {loading ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
