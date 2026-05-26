import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import TaskCard from '../components/TaskCard'
import './ProjectDetail.css'

function formatDateInput(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // add member form
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)

  // create task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', dueDate: '', priority: 'medium', assignedToId: ''
  })
  const [taskError, setTaskError] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = () => {
    setLoading(true)
    api.get(`/projects/${id}`)
      .then(res => setProject(res.data))
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false))
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberError('')
    setAddingMember(true)
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail })
      setProject(prev => ({
        ...prev,
        members: [...prev.members, res.data]
      }))
      setMemberEmail('')
      setShowAddMember(false)
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${id}/members/${memberId}`)
      setProject(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      }))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    if (!taskForm.title.trim()) {
      setTaskError('Title is required')
      return
    }
    setCreatingTask(true)
    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
        assignedToId: taskForm.assignedToId ? parseInt(taskForm.assignedToId) : undefined
      }
      const res = await api.post(`/tasks/project/${id}`, payload)
      setProject(prev => ({ ...prev, tasks: [res.data, ...prev.tasks] }))
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', assignedToId: '' })
      setShowTaskForm(false)
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setCreatingTask(false)
    }
  }

  const handleTaskUpdate = (updatedTask) => {
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    }))
  }

  const handleTaskDelete = (taskId) => {
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }))
  }

  if (loading) return <div className="loading-screen">Loading project...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!project) return null

  const isAdmin = project.myRole === 'admin'
  const tasksByStatus = {
    todo: project.tasks.filter(t => t.status === 'todo'),
    inprogress: project.tasks.filter(t => t.status === 'inprogress'),
    done: project.tasks.filter(t => t.status === 'done')
  }

  return (
    <div className="project-detail">
      <div className="project-header mb-24">
        <div>
          <h2 className="page-title" style={{ marginBottom: 4 }}>{project.name}</h2>
          {project.description && <p className="text-muted">{project.description}</p>}
        </div>
        <span className={`badge badge-${project.myRole}`}>{project.myRole}</span>
      </div>

      {/* Members section */}
      <div className="card mb-24">
        <div className="flex items-center justify-between mb-16">
          <h3 className="section-title">Members ({project.members.length})</h3>
          {isAdmin && (
            <button id="add-member-btn" className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(!showAddMember)}>
              {showAddMember ? 'Cancel' : '+ Add Member'}
            </button>
          )}
        </div>

        {showAddMember && (
          <form onSubmit={handleAddMember} className="add-member-form mb-16">
            {memberError && <div className="alert alert-error">{memberError}</div>}
            <div className="flex gap-8">
              <input
                id="member-email"
                type="email"
                className="input"
                placeholder="Member's email address"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                required
              />
              <button id="add-member-submit" type="submit" className="btn btn-primary" disabled={addingMember}>
                {addingMember ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        <div className="members-list">
          {project.members.map(m => (
            <div key={m.id} className="member-row">
              <div className="member-info">
                <div className="member-avatar">{m.user.name[0].toUpperCase()}</div>
                <div>
                  <div className="member-name">{m.user.name}</div>
                  <div className="member-email">{m.user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isAdmin && m.user.id !== user.id && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task board */}
      <div className="flex items-center justify-between mb-16">
        <h3 className="section-title">Tasks</h3>
        {isAdmin && (
          <button id="create-task-btn" className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
            {showTaskForm ? 'Cancel' : '+ Create Task'}
          </button>
        )}
      </div>

      {showTaskForm && (
        <div className="card mb-16">
          <h4 style={{ marginBottom: 16, fontSize: 14 }}>New Task</h4>
          {taskError && <div className="alert alert-error">{taskError}</div>}
          <form onSubmit={handleCreateTask}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  id="task-title"
                  type="text"
                  className="input"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  id="task-due-date"
                  type="date"
                  className="input"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                id="task-desc"
                type="text"
                className="input"
                placeholder="Optional description"
                value={taskForm.description}
                onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  id="task-priority"
                  className="input"
                  value={taskForm.priority}
                  onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select
                  id="task-assign"
                  className="input"
                  value={taskForm.assignedToId}
                  onChange={e => setTaskForm(p => ({ ...p, assignedToId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {project.members.map(m => (
                    <option key={m.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-8">
              <button id="task-submit" type="submit" className="btn btn-primary" disabled={creatingTask}>
                {creatingTask ? 'Creating...' : 'Create Task'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban columns */}
      <div className="kanban-board">
        {[
          { key: 'todo', label: 'To Do' },
          { key: 'inprogress', label: 'In Progress' },
          { key: 'done', label: 'Done' }
        ].map(col => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header">
              <span className="kanban-col-label">{col.label}</span>
              <span className="kanban-col-count">{tasksByStatus[col.key].length}</span>
            </div>
            <div className="kanban-tasks">
              {tasksByStatus[col.key].length === 0 ? (
                <div className="kanban-empty">No tasks</div>
              ) : (
                tasksByStatus[col.key].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    currentUserId={user.id}
                    members={project.members}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
