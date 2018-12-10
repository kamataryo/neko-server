const { RTCPeerConnection } = require('wrtc')
const { getAnswer, onCandidate } = require('../lib/webrtc-util')

const onOpen = ws =>
  new Promise((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onclose = () => reject(new Error('WebSocket closed'))
  })

const main = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  })

  console.log('Creating RTCPeerConnection')

  const peerConnection = new RTCPeerConnection({
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  })

  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))

  const cleanup = () => {
    console.log('Stopping MediaStreamTracks')
    stream.getTracks().forEach(track => track.stop())
    console.log('Closing RTCPeerConnection')
    peerConnection.close()
  }

  try {
    const ws = new WebSocket(`wss://${window.location.host}`)
    await onOpen(ws)
    ws.onclose = cleanup

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('Sending ICE candidate')
        ws.send(
          JSON.stringify({
            type: 'candidate',
            candidate,
          }),
        )
      }
    }

    const queuedCandidates = []
    onCandidate(ws, async candidate => {
      if (!peerConnection.remoteDescription) {
        queuedCandidates.push(candidate)
        return
      }
      console.log('Adding ICE candidate')
      await peerConnection.addIceCandidate(candidate)
      console.log('Added ICE candidate')
    })

    const video = document.createElement('video')
    document.body.appendChild(video)

    peerConnection.ontrack = ({ track, streams }) => {
      console.log(`Received ${track.kind} MediaStreamTrack with ID ${track.id}`)
      video.srcObject = streams[0]
      video.autoplay = true
    }

    console.log('Creating offer')
    const offer = await peerConnection.createOffer()

    console.log('Created offer; setting local description')
    await peerConnection.setLocalDescription(offer)

    console.log('Set local description; sending offer')
    ws.send(JSON.stringify(offer))

    console.log('Waiting for answer')
    const answer = await getAnswer(ws)

    console.log('Received answer; setting remote description')
    await peerConnection.setRemoteDescription(answer)
    console.log('Set remote description')

    await Promise.all(
      queuedCandidates.splice(0).map(async candidate => {
        console.log('Adding ICE candidate')
        await peerConnection.addIceCandidate(candidate)
        console.log('Added ICE candidate')
      }),
    )
  } catch (error) {
    cleanup()
    throw error
  }
}

main()
