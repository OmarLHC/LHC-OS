export type Role = 'admin' | 'manager' | 'employee'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type Audience = 'all' | 'department'

export interface Department {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  department_id: string | null
  title: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  department?: Department
}

export interface Announcement {
  id: string
  title: string
  body: string
  author_id: string
  audience: Audience
  department_id: string | null
  is_pinned: boolean
  email_sent: boolean
  created_at: string
  updated_at: string
  author?: Profile
  department?: Department
  read_count?: number
}

export interface Project {
  id: string
  name: string
  description: string | null
  client: string | null
  department_id: string | null
  owner_id: string | null
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  deadline: string | null
  progress: number
  created_at: string
  updated_at: string
  department?: Department
  owner?: Profile
  members?: Profile[]
  task_count?: number
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assignee_id: string | null
  department_id: string | null
  deadline: string | null
  estimated_hours: number | null
  actual_hours: number | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
  department?: Department
  project?: Project
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export interface Invitation {
  id: string
  email: string
  full_name: string
  role: Role
  department_id: string | null
  title: string | null
  token: string
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
  department?: Department
}
