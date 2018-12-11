const Hls = require('hls.js')
const { source } = require('./config')
const {
  isStreaming,
  startStreaming,
  stopStreaming,
} = require('./lib/stream-state')

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl'

const video = document.getElementById('video')
const start = document.getElementById('start')
const stop = document.getElementById('stop')
const message = document.getElementById('message')

start.addEventListener(
  'click',
  async () => (await isStreaming()) || (await startStreaming()),
)
stop.addEventListener(
  'click',
  async () => (await isStreaming()) && stopStreaming(),
)

const main = async () => {
  (await isStreaming()) || (await startStreaming())
  message.innerHMTL = ''

  if (Hls.isSupported()) {
    const hls = new Hls()
    hls.loadSource(source)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play())
  } else if (video.canPlayType(HLS_MIME_TYPE)) {
    video.src = source
    video.addEventListener('loadedmetadata', () => video.play())
  }
}

main()
