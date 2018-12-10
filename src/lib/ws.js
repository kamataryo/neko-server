const { Server } = require('ws')
const { RTCPeerConnection } = require('wrtc')
const { getOffer, onCandidate } = require('./webrtc-util')

let i = 0

module.exports = server =>
  new Server({ server }).on('connection', async ws => {
    const n = i++

    process.stdout.write(`${n}: Creating new RTCPeerConnection\n`)

    const pc = new RTCPeerConnection({
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    })

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        process.stdout.write(`${n}: Sending ICE candidate\n`)
        ws.send(
          JSON.stringify({
            type: 'candidate',
            candidate,
          }),
        )
      }
    }

    pc.ontrack = ({ track, streams }) => {
      process.stdout.write(
        `${n}: Received ${track.kind} MediaStreamTrack with ID ${track.id}\n`,
      )
      pc.addTrack(track, ...streams)
    }

    let queuedCandidates = []
    onCandidate(ws, async candidate => {
      if (!pc.remoteDescription) {
        queuedCandidates.push(candidate)
        return
      }
      process.stdout.write(`${n}: Adding ICE candidate\n`)
      await pc.addIceCandidate(candidate)
      process.stdout.write(`${n}: Added ICE candidate\n`)
    })

    ws.once('close', () => {
      process.stdout.write(`${n}: Closing RTCPeerConnection\n`)
      pc.close()
    })

    try {
      process.stdout.write(`${n}: Waiting for offer\n`)
      const offer = await getOffer(ws)

      process.stdout.write(`${n}: Received offer; setting remote description\n`)
      await pc.setRemoteDescription(offer)

      process.stdout.write(`${n}: Set remote description; creating answer\n`)
      const answer = await pc.createAnswer()

      process.stdout.write(`${n}: Created answer; setting local description\n`)
      await pc.setLocalDescription(answer)

      process.stdout.write(`${n}: Set local description; sending answer\n`)
      ws.send(JSON.stringify(answer))

      await Promise.all(
        queuedCandidates.splice(0).map(async candidate => {
          process.stdout.write(`${n}: Adding ICE candidate\n`)
          await pc.addIceCandidate(candidate)
          process.stdout.write(`${n}: Added ICE candidate\n`)
        }),
      )
    } catch (error) {
      console.error(error.stack || error.message || error)
      ws.close()
    }
  })
