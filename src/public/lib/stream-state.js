const isStreaming = () => fetch('./status').then(res => res.ok)
const startStreaming = () => fetch('./start').then(res => res.ok)
const stopStreaming = () => fetch('./stop').then(res => res.ok)

module.exports = { isStreaming, startStreaming, stopStreaming }
