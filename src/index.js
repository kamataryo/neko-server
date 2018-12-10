const express = require('express')
const browserify = require('browserify-middleware')
const { createServer } = require('http')
const { join } = require('path')
const ws = require('./lib/ws')
const app = express()

app.get('/main.js', browserify(join(__dirname, 'public', 'main.js')))
app.use(express.static(join(__dirname, 'public')))

const server = createServer(app)

server.listen(8080, () => {
  const address = server.address()
  process.stdout.write(`Server running at ${address.port}\n`)
})

ws(server)
