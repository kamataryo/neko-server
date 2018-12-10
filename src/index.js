const express = require('express')
const browserify = require('browserify-middleware')
const { createServer } = require('https')
const { join } = require('path')
const ws = require('./lib/ws')
const fs = require('fs')
const app = express()
const options = {
  key: fs.readFileSync(join(__dirname, '..', 'localhost-key.pem')),
  cert: fs.readFileSync(join(__dirname, '..', 'localhost.pem')),
}

app.get('/main.js', browserify(join(__dirname, 'public', 'main.js')))
app.use(express.static(join(__dirname, 'public')))

const server = createServer(options, app)

server.listen(8080, () => {
  const address = server.address()
  process.stdout.write(`Server running at ${address.port}\n`)
})

ws(server)
