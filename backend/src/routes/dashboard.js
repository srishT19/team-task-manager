const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const prisma = require('../models/prismaClient')

router.use(auth)

router.get('/', async (req, res) => {
  try {
    // get all projects user is in
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true }
    })
    const projectIds = memberships.map(m => m.projectId)

    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        byStatus: { todo: 0, inprogress: 0, done: 0 },
        overdueTasks: [],
        tasksByUser: [],
        myTasks: []
      })
    }

    const now = new Date()

    const [allTasks, overdueTasks, myTasks] = await Promise.all([
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        include: { assignedTo: { select: { id: true, name: true } } }
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'done' }
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          project: { select: { name: true } }
        }
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          assignedToId: req.user.id
        },
        include: {
          project: { select: { name: true } }
        },
        orderBy: { dueDate: 'asc' }
      })
    ])

    const byStatus = { todo: 0, inprogress: 0, done: 0 }
    allTasks.forEach(t => {
      if (byStatus[t.status] !== undefined) byStatus[t.status]++
    })

    // group by assignee
    const userMap = {}
    allTasks.forEach(t => {
      if (t.assignedTo) {
        const uid = t.assignedTo.id
        if (!userMap[uid]) userMap[uid] = { name: t.assignedTo.name, count: 0 }
        userMap[uid].count++
      }
    })
    const tasksByUser = Object.values(userMap)

    res.json({
      totalTasks: allTasks.length,
      byStatus,
      overdueTasks,
      tasksByUser,
      myTasks
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Dashboard error' })
  }
})

module.exports = router
