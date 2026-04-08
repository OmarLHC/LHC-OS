'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const CATEGORIES = ['drawing', 'contract', 'boq', 'submittal', 'rfi', 'warranty', 'inspection', 'report', 'photo', 'other']
const CAT_LABELS: Record<string, string> = {
  drawing: 'Drawing', contract: 'Contract', boq: 'BOQ', submittal: 'Submittal',
  rfi: 'RFI', warranty: 'Warranty', inspection: 'Inspection', report: 'Report', photo: 'Photo', other: 'Other'
}
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:           { bg: '#FFF3CD', color: '#856404',  label: 'Pending Review' },
  approved:          { bg: '#E1F5EE', color: '#0F6E56',  label: 'Approved' },
  revision_requested:{ bg: '#FDEDEC', color: '#C0392B',  label: 'Revision Needed' },
  sent_to_client:    { bg: '#E6F1FB', color: '#185FA5',  label: 'Sent to Client' },
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: prof } = await supabase.from('profiles').select('*, department:departments(*)').eq('id', user.id).single()
    setProfile(prof)
    const [{ data: d }, { data: p }, { data: t }] = await Promise.all([
      supabase.from('documents').select('*, project:projects(name,id), uploader:profiles!uploaded_by(full_name), approver:profiles!approved_by(full_name), task:tasks(title)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,name').eq('status', 'active').order('name'),
      supabase.from('tasks').select('id,title,project_id').order('title')
    ])
    setDocs(d || [])
    setProjects(p || [])
    setTasks(t || [])
    setLoading(false)
  }

  const isManagement = profile?.role === 'admin' || profile?.role === 'manager'

  const filtered = docs.filter(d =>
    (!filterProject || d.project_id === filterProject) &&
    (!filterStatus || d.status === filterStatus) &&
    (!filterCategory || d.category === filterCategory)
  )

  const pendingCount = docs.filter(d => d.status === 'pending').length

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Document Vault</h1>
            {pendingCount > 0 && isManagement && (
              <span style={{ padding: '3px 10px', background: '#FFCB1A', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#000' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{filtered.length} documents</p>
        </div>
        <button onClick={() => setShowUpload(true)} style={{ padding: '9px 18px', background: '#FFCB1A', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#000' }}>
          + Upload Document
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '7px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
      </div>

      {/* Documents table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#B4B4B5', fontSize: '14px' }}>
            No documents yet. <span style={{ color: '#FFCB1A', cursor: 'pointer' }} onClick={() => setShowUpload(true)}>Upload the first one →</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '0.5px solid #E8E6E3' }}>
                {['Document', 'Project', 'Category', 'Linked Task', 'Uploaded By', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#505151', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const st = STATUS_STYLE[doc.status] || STATUS_STYLE.pending
                return (
                  <tr key={doc.id} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #F0EEEB' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{doc.name}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{doc.file_name} · v{doc.version}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#505151' }}>{doc.project?.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#F5F4F1', color: '#505151', fontWeight: 500 }}>
                        {CAT_LABELS[doc.category]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>{doc.task?.title || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#505151' }}>
                      {doc.uploader?.full_name}
                      <div style={{ fontSize: '11px', color: '#B4B4B5' }}>{format(new Date(doc.created_at), 'MMM d, yyyy')}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setSelectedDoc(doc)} style={{ padding: '4px 12px', border: '0.5px solid #E8E6E3', borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#1A1A1A' }}>
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showUpload && <UploadModal projects={projects} tasks={tasks} profile={profile} onClose={() => setShowUpload(false)} onUploaded={load} />}
      {selectedDoc && <DocDetailModal doc={selectedDoc} isManagement={isManagement} profile={profile} onClose={() => setSelectedDoc(null)} onUpdated={() => { load(); setSelectedDoc(null) }} />}
    </div>
  )
}

function UploadModal({ projects, tasks, profile, onClose, onUploaded }: any) {
  const [form, setForm] = useState({ project_id: '', task_id: '', name: '', description: '', category: 'drawing' })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const projectTasks = tasks.filter((t: any) => t.project_id === form.project_id)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `documents/${form.project_id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('lhc-documents').upload(path, file)
    if (upErr) { setError('Upload failed: ' + upErr.message); setLoading(false); return }
    await supabase.from('documents').insert({
      project_id: form.project_id,
      task_id: form.task_id || null,
      name: form.name,
      description: form.description || null,
      category: form.category,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: path,
      uploaded_by: user?.id,
      status: 'pending'
    })
    onUploaded(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Upload Document</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={submit}>
          {[
            { label: 'Document Name *', key: 'name', required: true },
            { label: 'Description', key: 'description' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>{f.label}</label>
              <input required={f.required} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as any }} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>PROJECT *</label>
              <select required value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value, task_id: '' }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Select project</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>CATEGORY *</label>
              <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          {form.project_id && projectTasks.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>LINK TO TASK (optional)</label>
              <select value={form.task_id} onChange={e => setForm(p => ({ ...p, task_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">No task</option>
                {projectTasks.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#505151', marginBottom: '5px' }}>FILE *</label>
            <div style={{ border: '2px dashed #E8E6E3', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#FAFAF8' }}
              onClick={() => document.getElementById('file-input')?.click()}>
              {file ? (
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>📎</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Click to select file</div>
                  <div style={{ fontSize: '11px', color: '#B4B4B5', marginTop: '4px' }}>PDF, Excel, Word, AutoCAD, Images</div>
                </div>
              )}
            </div>
            <input id="file-input" type="file" style={{ display: 'none' }} accept=".pdf,.xlsx,.xls,.docx,.doc,.dwg,.dxf,.jpg,.jpeg,.png,.gif"
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
          {error && <div style={{ padding: '10px', background: '#FDEDEC', borderRadius: '8px', color: '#C0392B', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '0.5px solid #E8E6E3', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: '#FFCB1A', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#000', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DocDetailModal({ doc, isManagement, profile, onClose, onUpdated }: any) {
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showSendForm, setShowSendForm] = useState(false)
  const [clientEmail, setClientEmail] = useState(doc.client_email || '')
  const [emailMessage, setEmailMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const st = STATUS_STYLE[doc.status] || STATUS_STYLE.pending

  async function approve() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('documents').update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() }).eq('id', doc.id)
    onUpdated()
  }

  async function requestRevision() {
    if (!revisionNotes.trim()) return
    setLoading(true)
    await supabase.from('documents').update({ status: 'revision_requested', revision_notes: revisionNotes }).eq('id', doc.id)
    onUpdated()
  }

  async function sendToClient() {
    if (!clientEmail) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: urlData } = await supabase.storage.from('lhc-documents').createSignedUrl(doc.storage_path, 60 * 60 * 24)
    await fetch('/api/documents/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: doc.id, clientEmail, message: emailMessage, downloadUrl: urlData?.signedUrl, sentBy: user?.id })
    })
    onUpdated()
  }

  async function getDownloadUrl() {
    const { data } = await supabase.storage.from('lhc-documents').createSignedUrl(doc.storage_path, 60 * 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>{doc.name}</h2>
            <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: st.bg, color: st.color }}>{st.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Project', value: doc.project?.name },
            { label: 'Category', value: CAT_LABELS[doc.category] },
            { label: 'File', value: doc.file_name },
            { label: 'Version', value: `v${doc.version}` },
            { label: 'Uploaded by', value: doc.uploader?.full_name },
            { label: 'Upload date', value: format(new Date(doc.created_at), 'MMM d, yyyy') },
            doc.task && { label: 'Linked task', value: doc.task?.title },
            doc.approved_by && { label: 'Approved by', value: doc.approver?.full_name },
          ].filter(Boolean).map((f: any) => (
            <div key={f.label}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', letterSpacing: '0.06em', marginBottom: '2px' }}>{f.label.toUpperCase()}</div>
              <div style={{ fontSize: '13px', color: '#1A1A1A' }}>{f.value}</div>
            </div>
          ))}
        </div>

        {doc.description && (
          <div style={{ marginBottom: '20px', padding: '12px', background: '#F5F4F1', borderRadius: '8px', fontSize: '13px', color: '#505151' }}>
            {doc.description}
          </div>
        )}

        {doc.revision_notes && (
          <div style={{ marginBottom: '20px', padding: '12px', background: '#FDEDEC', borderRadius: '8px', fontSize: '13px', color: '#C0392B' }}>
            <strong>Revision needed:</strong> {doc.revision_notes}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={getDownloadUrl} style={{ padding: '9px', border: '0.5px solid #E8E6E3', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
            ↓ Download File
          </button>

          {isManagement && doc.status === 'pending' && (
            <>
              <button onClick={approve} disabled={loading} style={{ padding: '9px', background: '#0F6E56', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                ✓ Approve Document
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
                  placeholder="Revision notes required..."
                  style={{ flex: 1, padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px' }} />
                <button onClick={requestRevision} disabled={loading || !revisionNotes.trim()}
                  style={{ padding: '8px 14px', background: '#C0392B', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: !revisionNotes.trim() ? 0.4 : 1 }}>
                  Request Revision
                </button>
              </div>
            </>
          )}

          {isManagement && doc.status === 'approved' && !showSendForm && (
            <button onClick={() => setShowSendForm(true)} style={{ padding: '9px', background: '#185FA5', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              ✉ Send to Client
            </button>
          )}

          {showSendForm && (
            <div style={{ border: '0.5px solid #E8E6E3', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Send to Client</div>
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Client email address"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' as any }} />
              <textarea rows={3} value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Optional message to client..."
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px', fontSize: '13px', resize: 'vertical', marginBottom: '8px', boxSizing: 'border-box' as any }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSendForm(false)} style={{ padding: '7px 14px', border: '0.5px solid #E8E6E3', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={sendToClient} disabled={loading || !clientEmail}
                  style={{ padding: '7px 14px', background: '#185FA5', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: !clientEmail ? 0.4 : 1 }}>
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          )}

          {doc.status === 'sent_to_client' && (
            <div style={{ padding: '10px', background: '#E6F1FB', borderRadius: '8px', fontSize: '13px', color: '#185FA5' }}>
              ✓ Sent to client on {format(new Date(doc.sent_to_client_at), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
