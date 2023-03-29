import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import userRouter from './Routes/userRouter.js'

const app = express()
dotenv.config()

app.use(bodyParser.json({ limit: '30mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))
app.use(cors())

app.use('/users', userRouter)

app.use('/', (req, res) => {
  res.send('Welcome to Password Reset API')
})

const PORT = 5000 || process.env.PORT

// const CONNECTION_URL =
//   'mongodb+srv://password-reset:password-reset123@cluster0.xoqxadz.mongodb.net/?retryWrites=true&w=majority'

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port: ${PORT}`),
    ),
  )
  .catch((error) => console.log(error.message))
