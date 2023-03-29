import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

import otp from '../Models/otp.js'

import User from '../Models/UserModel.js'

export const signin = async (req, res) => {
  const { email, password } = req.body

  try {
    const existingUser = await User.findOne({ email })

    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist!" })

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password,
    )

    if (!isPasswordCorrect)
      return res.status(400).json({ message: 'Invalid Credentials' })

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      'test',
      { expiresIn: '1h' },
    )

    res.status(200).json({ result: existingUser, token })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' })
  }
}

export const signup = async (req, res) => {
  const { email, password, confirmPassword, firstName, lastName } = req.body

  try {
    const existingUser = await User.findOne({ email })

    if (existingUser)
      return res.status(400).json({ message: 'User already exists.' })

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords don't match" })

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    })

    const token = jwt.sign({ email: result.email, id: result._id }, 'test', {
      expiresIn: '1h',
    })

    res.status(200).json({ result: result, token })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' })
  }
}

export const emailSend = async (req, res) => {
  console.log(req.body)
  const { email } = req.body

  try {
    const data = await User.findOne({ email: email })
    if (data === null) {
      res.status(409).json({ message: 'Email was not found' })
    } else {
      const name = data.firstName

      let otpcode = Math.floor(Math.random() * 10000 + 1)
      let otpData = new otp({
        email: email,
        code: otpcode,
        expiresIn: new Date().getTime() + 300 * 1000,
      })
      const otpResponse = await otpData.save()
      mailer(name, email, otpcode)

      const message = `The mail with the OTP has been sent. Please check inbox`

      res.status(201).json({ data: data, message: message })
    }
  } catch (error) {
    res.status(409).json({ message: error.message })
  }
}

export const verifyCode = async (req, res) => {
  const { code } = req.body
  console.log(code)
  try {
    const data = await otp.findOne({ code: code })

    if (data === null) {
      res.status(409).json({ message: 'Invalid OTP' })
    } else {
      const currentTime = new Date().getTime()
      const expiresIn = parseInt(data.expiresIn)

      if (expiresIn < currentTime) {
        res.status(409).json({ data: data, message: 'Code is expired.' })
      } else {
        res.status(200).json({ data: data, message: 'Code is valid' })
      }
    }
  } catch (error) {
    res.status(409).json({ message: error.message })
  }
}

export const resetPassword = async (req, res) => {
  const { email, otp: otpCode, password, confirmPassword } = req.body

  try {
    let data = await otp.findOne({ code: otpCode })

    if (data) {
      const user = await User.findOne({ email: email })
      if (user) {
        if (password !== confirmPassword)
          return res.status(400).json({ message: "Passwords don't match" })

        const newHashedPassword = await bcrypt.hash(password, 10)

        const result = await User.findOneAndUpdate(
          { email: user.email },
          { $set: { password: newHashedPassword } },
          { new: true },
        )

        data.deleteOne({ code: otpCode })

        res
          .status(201)
          .json({ data: result, message: 'Password changed successfully' })
      } else {
        res.status(409).json({ message: 'User not found.' })
      }
    } else {
      res.status(409).json({ message: 'Could not find OTP in the database.' })
    }
  } catch (error) {
    res.status(409).json({ message: error.message })
  }
}

// Nodemailer Configurations to send Email
const mailer = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
     
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_TEST_PWD,
      },
      tls: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
    })

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Link to Reset Password',
      html: `<p>Hi ${name}, Your verification code to reset your password is ${otp}.</p>`,
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error)
      } else {
        console.log(`Mail has been sent:- ${info.response}`)
      }
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
