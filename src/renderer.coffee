'use strict'

{desktopCapturer} = require 'electron'
quickconnect = require 'rtc-quickconnect'
robot = require 'robotjs'

opts =
  room: process.env.RSHARE_ROOM or 'ndxbxrme-rshare-123'
  signaller: process.env.RSHARE_SIGNALLER or 'http://localhost:3000'
console.log 'opts', opts
hideControls = ->
  document.querySelector('.controls').style.display = 'none'
window.master = ->
  hideControls()
  dc = null
  desktopCapturer.getSources 
    types: ['screen', 'window']
  , (err, sources) ->
    console.log 'err', err
    console.log 'sources', sources
    mysource = null
    for source in sources
      if source.name is 'Entire screen'
        mysource = source
    navigator.mediaDevices.getUserMedia
      audio: false
      video:
        mandatory:
          chromeMediaSource: 'desktop'
          chromeMediaSourceId: mysource.id
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
          if evt.move
            robot.moveMouse evt.move.x, evt.move.y
          if evt.l
            robot.mouseToggle evt.l, 'left'
          if evt.r
            robot.mouseToggle evt.r, 'right'
          if evt.m
            robot.mouseToggle evt.m, 'middle'
        dc.send 'hiya'
      .on 'call:started', (id, pc, data) ->
        console.log 'talkin to', id
      video = document.querySelector 'video'
      video.srcObject = stream
      video.onloadedmetadata = (e) ->
        video.play()
window.client = ->
  hideControls()
  dc = null
  mouse =
    x: null
    y: null
    l: null
    r: null
    m: null
  lastMouse =
    x: null
    y: null
    l: null
    r: null
    m: null
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
    video.onmousedown = (e) ->
      mouse.l = e.buttons & 1 > 0
      mouse.r = e.buttons & 2 > 0
      mouse.m = e.buttons & 4 > 0
    video.onmouseup = (e) ->
      mouse.l = e.buttons & 1 > 0
      mouse.r = e.buttons & 2 > 0
      mouse.m = e.buttons & 4 > 0
      
    tick = ->
      obj = {}
      send = false
      if mouse.x isnt lastMouse.x or mouse.y isnt lastMouse.y
        lastMouse.x = mouse.x
        lastMouse.y = mouse.y
        obj.move =
          x: mouse.x
          y: mouse.y
        send = true
      if mouse.l isnt lastMouse.l
        obj.l = if mouse.l then 'down' else 'up'
        lastMouse.l = mouse.l
        send = true
      if mouse.r isnt lastMouse.r
        obj.r = if mouse.r then 'down' else 'up'
        lastMouse.r = mouse.r
        send = true
      if mouse.m isnt lastMouse.m
        obj.m = if mouse.m then 'down' else 'up'
        lastMouse.m = mouse.m
        send = true
      if send
        dc?.send JSON.stringify obj
      window.requestAnimationFrame tick
    tick()