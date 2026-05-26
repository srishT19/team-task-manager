import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import './Dashboard.css'

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-screen">Loading dashboard...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!data) return null

  const { totalTasks, byStatus, overdueTasks, tasksByUser, myTasks } = data

  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>

      <div className="grid-4 mb-24">
        <StatCard label="Total Tasks" value={totalTasks} color="var(--text)" />
        <StatCard label="To Do" value={byStatus.todo} color="var(--text-muted)" />
        <StatCard label="In Progress" value={byStatus.inprogress} color="var(--accent)" />
        <StatCard label="Done" value={byStatus.done} color="var(--success)" />
      </div>

      {/* My Tasks */}
      <div className="card mb-24">
        <h3 className="section-title mb-16">My Tasks</h3>
        {myTasks.length === 0 ? (
          <p className="text-muted">No tasks assigned to you.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                return (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td className="text-muted">{task.project?.name}</td>
                    <td className={isOverdue ? 'text-danger' : ''}>{formatDate(task.dueDate)}</td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="card mb-24">
          <h3 className="section-title mb-16" style={{ color: 'var(--danger)' }}>
            Overdue Tasks ({overdueTasks.length})
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Due Date</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {overdueTasks.map(task => (
                <tr key={task.id}>
                  <td className="text-danger">{task.title}</td>
                  <td className="text-muted">{task.project?.name}</td>
                  <td className="text-danger">{formatDate(task.dueDate)}</td>
                  <td>{task.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tasks by User */}
      {tasksByUser.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-16">Tasks by Team Member</h3>
          <div className="user-stats">
            {tasksByUser.map((u, i) => (
              <div key={i} className="user-stat-row">
                <span className="user-stat-name">{u.name}</span>
                <div className="user-stat-bar-wrap">
                  <div
                    className="user-stat-bar"
                    style={{ width: `${Math.min((u.count / Math.max(...tasksByUser.map(x => x.count))) * 100, 100)}%` }}
                  />
                </div>
                <span className="user-stat-count">{u.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
