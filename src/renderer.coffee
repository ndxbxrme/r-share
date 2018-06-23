'use strict'

{desktopCapturer} = require 'electron'
quickconnect = require 'rtc-quickconnect'
robot = require 'robotjs'

opts =
  room: process.env.RSHARE_ROOM or 'ndxbxrme-rshare-123'
  signaller: process.env.RSHARE_SIGNALLER or 'http://localhost:3000'
console.log 'opts', opts
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
        dc.onmessage = (event) ->
          evt = JSON.parse event.data
          console.log 'got message', evt, evt.type
          if evt.type is 'mousemove'
            robot.moveMouse evt.x, evt.y
        dc.send 'hiya'
      .on 'call:started', (id, pc, data) ->
        console.log 'talkin to', id
      video = document.querySelector 'video'
      video.srcObject = stream
      video.onloadedmetadata = (e) ->
        video.play()
window.client = ->
  dc = null
  mouse =
    x: null
    y: null
  lastMouse =
    x: null
    y: null
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
      mouse.x = e.clientX
      mouse.y = e.clientY
    tick = ->
      if mouse.x isnt lastMouse.x or mouse.y isnt lastMouse.y
        lastMouse.x = mouse.x
        lastMouse.y = mouse.y
        dc?.send JSON.stringify
          type: 'mousemove'
          x: mouse.x
          y: mouse.y
      window.requestAnimationFrame tick
    tick()