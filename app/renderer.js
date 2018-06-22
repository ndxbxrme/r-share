(function() {
  'use strict';
  var desktopCapturer, opts, quickconnect;

  ({desktopCapturer} = require('electron'));

  quickconnect = require('rtc-quickconnect');

  opts = {
    room: 'ndxbxrme-rshare-123',
    signaller: 'http://localhost:3000'
  };

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
          return dc.send('hiya');
        }).on('call:started', function(id, pc, data) {
          return console.log('talkin to', id);
        });
        video = document.querySelector('video');
        video.srcObject = stream;
        video.onloadedmetadata = function(e) {
          return video.play();
        };
        return video.onmousemove = function(e) {
          return dc != null ? dc.send({
            x: e.clientX,
            y: e.clientY
          }) : void 0;
        };
      });
    });
  };

  window.client = function() {
    return quickconnect(opts.signaller, {
      room: opts.room,
      plugins: []
    }).createDataChannel('events').on('channel:opened:events', function(id, dc) {
      console.log('chizzannel open');
      return dc.onmessage = function(evt) {
        return console.log(evt.data);
      };
    }).on('call:started', function(id, pc, data) {
      var video;
      console.log('hey', id);
      video = document.querySelector('video');
      video.srcObject = pc.getRemoteStreams()[0];
      return video.onloadedmetadata = function(e) {
        return video.play();
      };
    });
  };

}).call(this);

//# sourceMappingURL=renderer.js.map
