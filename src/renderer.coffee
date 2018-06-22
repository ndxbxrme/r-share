'use strict'

{desktopCapturer} = require 'electron'
quickconnect = require 'rtc-quickconnect'

opts =
  room: process.env.RSHARE_ROOM or 'ndxbxrme-rshare-123'
  signaller: process.env.RSHARE_SIGNALLER or 'http://localhost:3000'

window.master = ->
  dc = null
  desktopCapturer.getSources 
    types: ['screen', 'window']
  , (err, sources) ->
    console.log 'err', err
    console.log 'sources', sources
    navigator.mediaDevices.getUserMedia
      audio: false
      video:
        mandatory:
          chromeMediaSource: 'desktop'
          chromeMediaSourceId: sources[1].id
    .then (stream) ->
      quickconnect opts.signaller,
        room: opts.room
        plugins: []
      .addStream stream
      .createDataChannel 'events'
      .on 'channel:opened:events', (id, _dc) ->
        dc = _dc
        console.log 'channel open', id
        dc.onmessage = (evt) ->
          console.log evt.data
        dc.send 'hiya'
      .on 'call:started', (id, pc, data) ->
        console.log 'talkin to', id
      video = document.querySelector 'video'
      video.srcObject = stream
      video.onloadedmetadata = (e) ->
        video.play()
window.client = ->
  dc = null
  quickconnect opts.signaller,
    room: opts.room
    plugins: []
  .createDataChannel 'events'
  .on 'channel:opened:events', (id, _dc) ->
    dc = _dc
    console.log 'chizzannel open'
    dc.onmessage = (evt) ->
      console.log evt.data
  .on 'call:started', (id, pc, data) ->
    console.log 'hey', id
    video = document.querySelector 'video'
    video.srcObject = pc.getRemoteStreams()[0]
    video.onloadedmetadata = (e) ->
      video.play()
    video.onmousemove = (e) ->
      dc?.send
        x: e.clientX
        y: e.clientY