const prisma = require('../models/prismaClient')

// get all projects the current user is part of
const getProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
            _count: { select: { tasks: true } }
          }
        }
      }
    })

    const projects = memberships.map(m => ({
      ...m.project,
      myRole: m.role
    }))

    res.json(projects)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch projects' })
  }
}

const createProject = async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ message: 'Project name required' })

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        createdById: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'admin'  // creator is always admin
          }
        }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    })

    res.status(201).json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create project' })
  }
}

const getProject = async (req, res) => {
  const projectId = parseInt(req.params.id)

  try {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id }
    })
    if (!member) return res.status(403).json({ message: 'Access denied' })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    res.json({ ...project, myRole: member.role })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to get project' })
  }
}

const addMember = async (req, res) => {
  const projectId = parseInt(req.params.id)
  const { email, role = 'member' } = req.body

  try {
    // check requester is admin
    const requester = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id }
    })
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add members' })
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } })
    if (!userToAdd) return res.status(404).json({ message: 'User not found' })

    // check if already a member
    const alreadyIn = await prisma.projectMember.findFirst({
      where: { projectId, userId: userToAdd.id }
    })
    if (alreadyIn) return res.status(400).json({ message: 'Already a member' })

    const membership = await prisma.projectMember.create({
      data: { projectId, userId: userToAdd.id, role },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    res.status(201).json(membership)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to add member' })
  }
}

const removeMember = async (req, res) => {
  const projectId = parseInt(req.params.id)
  const memberId = parseInt(req.params.memberId)

  try {
    const requester = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id }
    })
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' })
    }

    // don't let admin remove themselves if they're the only admin
    const membership = await prisma.projectMember.findUnique({ where: { id: memberId } })
    if (!membership) return res.status(404).json({ message: 'Member not found' })

    await prisma.projectMember.delete({ where: { id: memberId } })
    res.json({ message: 'Member removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to remove member' })
  }
}

module.exports = { getProjects, createProject, getProject, addMember, removeMember }
