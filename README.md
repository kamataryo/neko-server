# NEKO SERVER

[![Build Status](https://travis-ci.org/kamataryo/neko-server.svg?branch=master)](https://travis-ci.org/kamataryo/neko-server)

This is a webRTC server and client.

# Development

```shell
mkcert localhost
```

## Live Streaming with HLS

```shell
ffmpeg -f avfoundation -framerate 30 -i "0:0" \
  -vcodec libx264 -vf format=yuv420p -preset veryfast -b:v 512000 \
  -acodec libmp3lame -b:a 256000 -ar 44100 \
  -f hls -hls_list_size 3 -hls_time 10 -hls_flags delete_segments playlist.m3u8
```

'ffmpeg',[
'-f',
'avfoundation',
'-framerate',
'30',
'-i',
'"0:0"',
'-vcodec',
'libx264',
'-vf',
'format=yuv420p',
'-preset',
'veryfast',
'-b:v 512000',
'-acodec',
'libmp3lame',
'-b:a',
'256000',
'-ar',
'44100',
'-f',
'hls',
'-hls_list_size',
'3',
'-hls_time',
'10',
'-hls_flags',
'delete_segments',
'./src/public/stream/playlist.m3u8'
]
