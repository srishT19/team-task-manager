const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { createTask, updateTask, deleteTask } = require('../controllers/taskController')

router.use(auth)

router.post('/project/:projectId', createTask)
router.put('/:taskId', updateTask)
router.delete('/:taskId', deleteTask)

module.exports = router
