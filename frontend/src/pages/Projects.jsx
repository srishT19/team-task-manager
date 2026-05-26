import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './Projects.css'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = () => {
    setLoading(true)
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!name.trim()) {
      setFormError('Project name is required')
      return
    }
    setCreating(true)
    try {
      const res = await api.post('/projects', { name: name.trim(), description: description.trim() || undefined })
      setProjects(prev => [{ ...res.data, myRole: 'admin', _count: { tasks: 0 } }, ...prev])
      setShowForm(false)
      setName('')
      setDescription('')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="loading-screen">Loading projects...</div>

  return (
    <div className="projects-page">
      <div className="flex items-center justify-between mb-24">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Projects</h2>
        <button id="new-project-btn" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card mb-24">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Create New Project</h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="project-name">Project Name</label>
              <input
                id="project-name"
                type="text"
                className="input"
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-desc">Description (optional)</label>
              <input
                id="project-desc"
                type="text"
                className="input"
                placeholder="What's this project about?"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-8">
              <button id="create-project-submit" type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state card">
          <p>No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div
              key={project.id}
              className="project-card card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="project-card-header">
                <h3 className="project-name">{project.name}</h3>
                <span className={`badge badge-${project.myRole}`}>{project.myRole}</span>
              </div>
              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}
              <div className="project-meta">
                <span>{project.members?.length ?? 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                <span>{project._count?.tasks ?? 0} task{project._count?.tasks !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
