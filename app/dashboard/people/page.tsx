'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Department } from '@/lib/types'

const DEPT_COLORS: Record<string, string> = {
  'Management': '#1A1A1A', 'Technical Office': '#185FA5',
  'Business Development': '#FFCB1A', 'Finance & Accounting': '#0F6E56',
  'Procurement': '#854F0B', 'Site / Operations': '#993C1D', 'HR / Admin': '#534AB7'
}

export default function PeoplePage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filterDept, setFilterDept] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: profs }, { data: depts }] = await Promise.all([
      supabase.from('profiles').select('*, department:departments(*)').eq('is_active', true).order('full_name'),
      supabase.from('departments').select('*').order('name')
    ])
    setProfiles(profs || [])
    setDepartments(depts || [])
    setLoading(false)
  }

  const filtered = profiles.filter(p =>
    (!filterDept || p.department_id === filterDept) &&
    (!search || p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(search.toLowerCase()))
  )

  // Group by department
  const grouped = departments.reduce((acc, dept) => {
    const members = filtered.filter(p => p.department_id === dept.id)
    if (members.length > 0 || !filterDept) acc[dept.id] = { dept, members }
    return acc
  }, {} as Record<string, { dept: Department, members: any[] }>)

  const ungrouped = filtered.filter(p => !p.department_id)

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>People</h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          {profiles.length} active team members across {departments.length} departments
        </p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          placeholder="Search by name, email, or title..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 14px', border: '0.5px solid #E8E6E3',
            borderRadius: '8px', fontSize: '13px', background: '#fff' }}
        />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: '9px 12px', border: '0.5px solid #E8E6E3', borderRadius: '8px',
            fontSize: '13px', background: '#fff', color: '#1A1A1A' }}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Departments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.values(grouped).map(({ dept, members }) => (
          members.length > 0 && (
            <div key={dept.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%',
                  background: dept.color || DEPT_COLORS[dept.name] || '#FFCB1A' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#1A1A1A' }}>
                  {dept.name}
                </h2>
                <span style={{ fontSize: '12px', color: '#B4B4B5' }}>{members.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {members.map(person => <PersonCard key={person.id} person={person} />)}
              </div>
            </div>
          )
        ))}

        {ungrouped.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#B4B4B5' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#1A1A1A' }}>Unassigned</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {ungrouped.map(person => <PersonCard key={person.id} person={person} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#B4B4B5',
            background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3' }}>
            No team members found.
          </div>
        )}
      </div>
    </div>
  )
}

function PersonCard({ person }: { person: any }) {
  const initials = person.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const deptColor = person.department?.color || '#FFCB1A'
  const roleColors: Record<string, [string, string]> = {
    admin: ['#1A1A1A', '#fff'],
    manager: ['#185FA5', '#E6F1FB'],
    employee: ['#E8E6E3', '#505151']
  }
  const [roleBg, roleText] = roleColors[person.role] || roleColors.employee

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E8E6E3',
      padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: deptColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', fontWeight: 700,
        color: deptColor === '#FFCB1A' || deptColor === '#FEEB54' ? '#000' : '#fff',
        flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{person.full_name}</div>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
            background: roleBg, color: roleText, fontWeight: 500, marginLeft: '6px', flexShrink: 0 }}>
            {person.role}
          </span>
        </div>
        {person.title && (
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{person.title}</div>
        )}
        <a href={`mailto:${person.email}`} style={{
          fontSize: '12px', color: '#185FA5', marginTop: '6px', display: 'block',
          textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>{person.email}</a>
        {person.phone && (
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{person.phone}</div>
        )}
      </div>
    </div>
  )
}
