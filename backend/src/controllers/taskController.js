const prisma = require('../models/prismaClient')

const createTask = async (req, res) => {
  const projectId = parseInt(req.params.projectId)
  const { title, description, dueDate, priority, assignedToId } = req.body

  if (!title) return res.status(400).json({ message: 'Title is required' })

  try {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id }
    })
    if (!member) return res.status(403).json({ message: 'Not a project member' })
    if (member.role !== 'admin') return res.status(403).json({ message: 'Only admins can create tasks' })

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        status: 'todo',
        projectId,
        createdById: req.user.id,
        assignedToId: assignedToId ? parseInt(assignedToId) : null
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    res.status(201).json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create task' })
  }
}

const updateTask = async (req, res) => {
  const taskId = parseInt(req.params.taskId)
  const { title, description, dueDate, priority, status, assignedToId } = req.body

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ message: 'Task not found' })

    const member = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: req.user.id }
    })
    if (!member) return res.status(403).json({ message: 'Access denied' })

    // members can only update status on tasks assigned to them
    if (member.role !== 'admin') {
      if (task.assignedToId !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own tasks' })
      }
      // members can only update status field
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: { status: status || task.status },
        include: {
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } }
        }
      })
      return res.json(updated)
    }

    // admin can update everything
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        dueDate: dueDate ? new Date(dueDate) : task.dueDate,
        priority: priority || task.priority,
        status: status || task.status,
        assignedToId: assignedToId !== undefined ? (assignedToId ? parseInt(assignedToId) : null) : task.assignedToId
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update task' })
  }
}

const deleteTask = async (req, res) => {
  const taskId = parseInt(req.params.taskId)

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ message: 'Task not found' })

    const member = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: req.user.id }
    })
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' })
    }

    await prisma.task.delete({ where: { id: taskId } })
    res.json({ message: 'Task deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete task' })
  }
}

module.exports = { createTask, updateTask, deleteTask }
