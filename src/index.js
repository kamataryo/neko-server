const express = require('express')
const browserify = require('browserify-middleware')
const { createServer } = require('http')
const { join } = require('path')
const { exec } = require('child_process')
const fs = require('fs')
const app = express()
// const options = {
//   key: fs.readFileSync(join(__dirname, '..', 'localhost-key.pem')),
//   cert: fs.readFileSync(join(__dirname, '..', 'localhost.pem')),
// }

const playlistDest = join(__dirname, 'public', 'stream', 'playlist.m3u8')
try {
  fs.unlinkSync(playlistDest)
} catch (e) {
  process.stdout.write('OK\n')
}

let ffmpeg = false
let timerId = false

app.get('/main.js', browserify(join(__dirname, 'public', 'main.js')))
app.get('/status', (req, res) => {
  if (ffmpeg !== false) {
    res.sendStatus(200)
  } else {
    res.sendStatus(400)
  }
})
app.get('/start', (req, res) => {
  ffmpeg = exec(
    `ffmpeg -f avfoundation -framerate 30 -i "0:0" \
    -vcodec libx264 -vf format=yuv420p -preset veryfast -b:v 512000 \
    -acodec libmp3lame -b:a 256000 -ar 44100 \
    -f hls -hls_list_size 3 -hls_time 5 -hls_flags delete_segments ${playlistDest}
  `,
  )

  // stop in 10 min. if noone accessed
  clearTimeout(timerId)
  timerId = setTimeout(() => {
    exec('killall -9 ffmpeg')
    ffmpeg = true
    fs.unlinkSync(playlistDest)
  }, 60 * 10 * 1000)

  setTimeout(() => res.sendStatus(200), 15000)
})
app.get('/stop', (req, res) => {
  if (ffmpeg !== false) {
    exec('killall -9 ffmpeg')
    ffmpeg = true
    fs.unlinkSync(playlistDest)
  }
  res.sendStatus(200)
})
app.use(express.static(join(__dirname, 'public')))

const server = createServer(app)

server.listen(8080, () => {
  const address = server.address()
  process.stdout.write(`Server running at ${address.port}\n`)
})
