const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { signup, login, getMe } = require('../controllers/authController')
const auth = require('../middleware/auth')

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], signup)

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], login)

router.get('/me', auth, getMe)

module.exports = router
