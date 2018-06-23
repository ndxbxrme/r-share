(function() {
  'use strict';
  var desktopCapturer, hideControls, opts, quickconnect, robot;

  ({desktopCapturer} = require('electron'));

  quickconnect = require('rtc-quickconnect');

  robot = require('robotjs');

  opts = {
    room: process.env.RSHARE_ROOM || 'ndxbxrme-rshare-123',
    signaller: process.env.RSHARE_SIGNALLER || 'http://localhost:3000'
  };

  console.log('opts', opts);

  hideControls = function() {
    return document.querySelector('.controls').style.display = 'none';
  };

  window.master = function() {
    var dc;
    hideControls();
    dc = null;
    return desktopCapturer.getSources({
      types: ['screen', 'window']
    }, function(err, sources) {
      var i, len, mysource, source;
      console.log('err', err);
      console.log('sources', sources);
      mysource = null;
      for (i = 0, len = sources.length; i < len; i++) {
        source = sources[i];
        if (source.name === 'Entire screen') {
          mysource = source;
        }
      }
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: mysource.id
          }
        }
      }).then(function(stream) {
        var video;
        quickconnect(opts.signaller, {
          room: opts.room,
          plugins: []
        }).addStream(stream).createDataChannel('events').on('channel:opened:events', function(id, _dc) {
          dc = _dc;
          console.log('channel open', id);
          dc.onmessage = function(event) {
            var evt;
            evt = JSON.parse(event.data);
            console.log('got message', evt, evt.type);
            if (evt.type === 'mousemove') {
              return robot.moveMouse(evt.x, evt.y);
            }
          };
          return dc.send('hiya');
        }).on('call:started', function(id, pc, data) {
          return console.log('talkin to', id);
        });
        video = document.querySelector('video');
        video.srcObject = stream;
        return video.onloadedmetadata = function(e) {
          return video.play();
        };
      });
    });
  };

  window.client = function() {
    var dc, lastMouse, mouse;
    hideControls();
    dc = null;
    mouse = {
      x: null,
      y: null
    };
    lastMouse = {
      x: null,
      y: null
    };
    return quickconnect(opts.signaller, {
      room: opts.room,
      plugins: []
    }).createDataChannel('events').on('channel:opened:events', function(id, _dc) {
      dc = _dc;
      console.log('chizzannel open');
      return dc.onmessage = function(evt) {
        return console.log(evt.data);
      };
    }).on('call:started', function(id, pc, data) {
      var tick, video;
      console.log('hey', id);
      video = document.querySelector('video');
      video.srcObject = pc.getRemoteStreams()[0];
      video.onloadedmetadata = function(e) {
        return video.play();
      };
      video.onmousemove = function(e) {
        mouse.x = e.clientX;
        return mouse.y = e.clientY;
      };
      tick = function() {
        if (mouse.x !== lastMouse.x || mouse.y !== lastMouse.y) {
          lastMouse.x = mouse.x;
          lastMouse.y = mouse.y;
          if (dc != null) {
            dc.send(JSON.stringify({
              type: 'mousemove',
              x: mouse.x,
              y: mouse.y
            }));
          }
        }
        return window.requestAnimationFrame(tick);
      };
      return tick();
    });
  };

}).call(this);

//# sourceMappingURL=renderer.js.map
