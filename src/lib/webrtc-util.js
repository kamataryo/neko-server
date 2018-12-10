const { RTCIceCandidate, RTCSessionDescription } = require('wrtc')

const getMessage = (ws, type) =>
  new Promise((resolve, reject) => {
    const onMessage = ({ data }) => {
      try {
        const message = JSON.parse(data)
        if (message.type === type) {
          resolve(message)
        }
      } catch (error) {
        reject(error)
      } finally {
        cleanup()
      }
    }

    const onClose = () => {
      reject(new Error('WebSocket closed'))
      cleanup()
    }

    const cleanup = () => {
      ws.removeEventListener('message', onMessage)
      ws.removeEventListener('close', onClose)
    }

    ws.addEventListener('message', onMessage)
    ws.addEventListener('close', onClose)
  })

const getOffer = async ws => {
  const offer = await getMessage(ws, 'offer')
  return new RTCSessionDescription(offer)
}

const getAnswer = async ws => {
  const answer = await getMessage(ws, 'answer')
  return new RTCSessionDescription(answer)
}

const onCandidate = (ws, callback) => {
  ws.addEventListener('message', ({ data }) => {
    try {
      const message = JSON.parse(data)
      if (message.type === 'candidate') {
        const candidate = new RTCIceCandidate(message.candidate)
        callback(candidate)
        return
      }
    } catch (error) {
      // Do nothing.
    }
  })
}

exports.getOffer = getOffer
exports.getAnswer = getAnswer
exports.onCandidate = onCandidate
