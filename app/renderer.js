(function() {
  'use strict';
  var desktopCapturer, opts, quickconnect, robot;

  ({desktopCapturer} = require('electron'));

  quickconnect = require('rtc-quickconnect');

  robot = require('robotjs');

  opts = {
    room: process.env.RSHARE_ROOM || 'ndxbxrme-rshare-123',
    signaller: process.env.RSHARE_SIGNALLER || 'http://localhost:3000'
  };

  console.log('opts', opts);

  window.master = function() {
    var dc;
    dc = null;
    return desktopCapturer.getSources({
      types: ['screen', 'window']
    }, function(err, sources) {
      console.log('err', err);
      console.log('sources', sources);
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[1].id
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
          dc.onmessage = function(evt) {
            if (evt.type === 'mousemove') {
              robot.moveMouse(evt.x, evt.y);
              return console.log(evt.data);
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
    var dc;
    dc = null;
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
      var video;
      console.log('hey', id);
      video = document.querySelector('video');
      video.srcObject = pc.getRemoteStreams()[0];
      video.onloadedmetadata = function(e) {
        return video.play();
      };
      return video.onmousemove = function(e) {
        return dc != null ? dc.send({
          type: 'mousemove',
          x: e.clientX,
          y: e.clientY
        }) : void 0;
      };
    });
  };

}).call(this);

//# sourceMappingURL=renderer.js.map
