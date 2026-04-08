'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Department } from '@/lib/types'

export default function AdminPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [tab, setTab] = useState<'team' | 'invite' | 'pending'>('team')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'admin') { router.push('/dashboard'); return }
    setCurrentUser(prof)

    const [{ data: profs }, { data: invs }, { data: depts }] = await Promise.all([
      supabase.from('profiles').select('*, department:departments(name,color)').order('full_name'),
      supabase.from('invitations').select('*, department:departments(name), inviter:profiles!invited_by(full_name)').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name')
    ])
    setProfiles(profs || [])
    setInvitations(invs || [])
    setDepartments(depts || [])
    setLoading(false)
  }

  async function updateRole(userId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    load()
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', userId)
    load()
  }

  async function revokeInvite(inviteId: string) {
    if (!confirm('Revoke this invitation?')) return
    await supabase.from('invitations').delete().eq('id', inviteId)
    load()
  }

  async function resendInvite(inviteId: string) {
    await fetch('/api/invite/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inviteId }) })
    alert('Invitation resent.')
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  const pendingInvites = invitations.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date())

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Admin</h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Team management, invitations, and system settings
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F5F4F1', padding: '4px',
        borderRadius: '10px', width: 'fit-content', marginBottom: '24px' }}>
        {[
          { id: 'team', label: `Team (${profiles.length})` },
          { id: 'invite', label: 'Invite Employee' },
          { id: 'pending', label: `Pending (${pendingInvites.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '7px 16px', borderRadius: '8px', border: 'none',
            background: tab === t.id ? '#fff' : 'transparent',
            fontSize: '13px', fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? '#1A1A1A' : '#888', cursor: 'pointer',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* TEAM TAB */}
      {tab === 'team' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '0.5px solid #E8E6E3' }}>
                {['Employee', 'Department', 'Title', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px',
                    fontWeight: 600, color: '#505151', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((person, i) => {
                const initials = person.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <tr key={person.id} style={{ borderBottom: i < profiles.length - 1 ? '0.5px solid #F0EEEB' : 'none',
                    opacity: person.is_active ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%',
                          background: person.department?.color || '#FFCB1A',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700,
                          color: ['#FFCB1A','#FEEB54'].includes(person.department?.color) ? '#000' : '#fff',
                          flexShrink: 0 }}>{initials}</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{person.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>{person.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>
                      {person.department?.name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>
                      {person.title || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={person.role}
                        onChange={e => { if (person.id !== currentUser?.id) updateRole(person.id, e.target.value) }}
                        disabled={person.id === currentUser?.id}
                        style={{ padding: '4px 8px', border: '0.5px solid #E8E6E3', borderRadius: '6px',
                          fontSize: '12px', background: '#fff', cursor: person.id === currentUser?.id ? 'not-allowed' : 'pointer' }}>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: person.is_active ? '#E1F5EE' : '#F5F4F1',
                        color: person.is_active ? '#0F6E56' : '#888' }}>
                        {person.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {person.id !== currentUser?.id && (
                        <button onClick={() => toggleActive(person.id, person.is_active)}
                          style={{ padding: '4px 10px', border: `0.5px solid ${person.is_active ? '#F09595' : '#C0DD97'}`,
                            borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer',
                            color: person.is_active ? '#A32D2D' : '#3B6D11' }}>
                          {person.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* INVITE TAB */}
      {tab === 'invite' && (
        <div style={{ maxWidth: '520px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3', padding: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px' }}>Invite a new employee</h2>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 24px' }}>
              They'll receive an email with a link to set their password and activate their account.
            </p>
            <InviteForm departments={departments} currentUserId={currentUser?.id} onSent={() => { setTab('pending'); load() }} />
          </div>
        </div>
      )}

      {/* PENDING TAB */}
      {tab === 'pending' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3', overflow: 'hidden' }}>
          {pendingInvites.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#B4B4B5', fontSize: '14px' }}>
              No pending invitations.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '0.5px solid #E8E6E3' }}>
                  {['Invited', 'Email', 'Department', 'Role', 'Expires', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px',
                      fontWeight: 600, color: '#505151', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < pendingInvites.length - 1 ? '0.5px solid #F0EEEB' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500 }}>{inv.full_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>{inv.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>{inv.department?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px',
                        background: '#E8E6E3', color: '#505151', fontWeight: 500 }}>{inv.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>
                      {format(new Date(inv.expires_at), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => resendInvite(inv.id)}
                          style={{ padding: '4px 10px', border: '0.5px solid #E8E6E3', borderRadius: '6px',
                            background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#185FA5' }}>
                          Resend
                        </button>
                        <button onClick={() => revokeInvite(inv.id)}
                          style={{ padding: '4px 10px', border: '0.5px solid #F09595', borderRadius: '6px',
                            background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#A32D2D' }}>
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function InviteForm({ departments, currentUserId, onSent }: {
  departments: Department[], currentUserId: string, onSent: () => void
}) {
  const [form, setForm] = useState({ full_name: '', email: '', role: 'employee', department_id: '', title: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.email.endsWith('@lighthouseegypt.com')) {
      setError('Email must be a @lighthouseegypt.com address.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, invited_by: currentUserId })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to send invitation.'); setLoading(false); return }
    setSuccess(`Invitation sent to ${form.email}`)
    setForm({ full_name: '', email: '', role: 'employee', department_id: '', title: '' })
    setLoading(false)
    onSent()
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Full Name *</label>
          <input required value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Ahmed Hassan"
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Email *</label>
          <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="ahmed@lighthouseegypt.com"
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Job Title</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Site Engineer"
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Role</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#505151', marginBottom: '6px' }}>Department</label>
        <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}
          style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
          <option value="">Select department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#FFF0F0', border: '0.5px solid #F09595',
        borderRadius: '8px', color: '#A32D2D', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '10px 14px', background: '#E1F5EE', border: '0.5px solid #9FE1CB',
        borderRadius: '8px', color: '#0F6E56', fontSize: '13px', marginBottom: '16px' }}>✓ {success}</div>}

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '11px', background: '#FFCB1A', border: 'none',
        borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        color: '#000', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Sending invitation...' : 'Send Invitation Email'}
      </button>
    </form>
  )
}
