const express = require('express')

const cors = require('cors')

var port = 8000

var whitelist = ['http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}

const app = express()

app.use(cors(corsOptions))

app.use('/api',require('./api'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))