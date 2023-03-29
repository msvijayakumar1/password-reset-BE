import express from 'express'
import {
  signin,
  signup,
  emailSend,
  resetPassword,
  verifyCode,
} from '../Controllers/users.js'

const router = express.Router()

router.post('/signin', signin)
router.post('/signup', signup)

router.post('/email-send', emailSend)
router.post('/verify', verifyCode)

router.post('/reset-password', resetPassword)

export default router
