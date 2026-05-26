const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  getProjects, createProject, getProject,
  addMember, removeMember
} = require('../controllers/projectController')

router.use(auth)

router.get('/', getProjects)
router.post('/', createProject)
router.get('/:id', getProject)
router.post('/:id/members', addMember)
router.delete('/:id/members/:memberId', removeMember)

module.exports = router
