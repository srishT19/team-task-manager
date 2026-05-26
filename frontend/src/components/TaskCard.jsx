import React, { useState } from 'react'
import api from '../api/axios'
import './TaskCard.css'

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false
  return new Date(dateStr) < new Date()
}

export default function TaskCard({ task, isAdmin, currentUserId, members, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    priority: task.priority,
    status: task.status,
    assignedToId: task.assignedTo?.id || ''
  })
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const overdue = isOverdue(task.dueDate, task.status)
  const canUpdateStatus = !isAdmin && task.assignedToId === currentUserId

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true)
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: newStatus })
      onUpdate(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description || undefined,
        dueDate: editForm.dueDate || undefined,
        priority: editForm.priority,
        status: editForm.status,
        assignedToId: editForm.assignedToId ? parseInt(editForm.assignedToId) : null
      }
      const res = await api.put(`/tasks/${task.id}`, payload)
      onUpdate(res.data)
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${task.id}`)
      onDelete(task.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task')
    }
  }

  if (editing) {
    return (
      <div className="task-card editing">
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <input
              type="text"
              className="input"
              value={editForm.title}
              onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Task title"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              className="input"
              value={editForm.description}
              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select className="input" value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select className="input" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <input
              type="date"
              className="input"
              value={editForm.dueDate}
              onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))}
            />
            <select className="input" value={editForm.assignedToId} onChange={e => setEditForm(p => ({ ...p, assignedToId: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-8">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={`task-card ${overdue ? 'overdue' : ''}`}>
      <div className="task-card-top">
        <div className="task-badges">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        </div>
        {isAdmin && (
          <div className="task-actions">
            <button className="task-action-btn" onClick={() => setEditing(true)} title="Edit">✎</button>
            <button className="task-action-btn danger" onClick={handleDelete} title="Delete">✕</button>
          </div>
        )}
      </div>

      <div className="task-title">{task.title}</div>

      {task.description && (
        <div className="task-desc">{task.description}</div>
      )}

      <div className="task-meta">
        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue-text' : ''}`}>
            {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
        <span className="task-assignee">
          {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
        </span>
      </div>

      {/* member can update status on their tasks */}
      {canUpdateStatus && (
        <div style={{ marginTop: 8 }}>
          <select
            className="input"
            value={task.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={statusUpdating}
            style={{ fontSize: 12, padding: '4px 8px' }}
          >
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      )}
    </div>
  )
}
