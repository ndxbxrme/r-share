(function() {
  'use strict';
  var BrowserWindow, app, autoUpdater, mainWindow, path, ready, url;

  ({app, BrowserWindow} = require('electron'));

  ({autoUpdater} = require('electron-updater'));

  url = require('url');

  path = require('path');

  mainWindow = null;

  ready = function() {
    autoUpdater.checkForUpdatesAndNotify();
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600
    });
    mainWindow.on('closed', function() {
      return mainWindow = null;
    });
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
    mainWindow.openDevTools();
    return mainWindow.webContents.session.setCertificateVerifyProc(function(req, cb) {
      console.log('verify cert', req.hostname);
      return cb(0);
    });
  };

  app.on('ready', ready);

  app.on('window-all-closed', function() {
    return process.platform === 'darwin' || app.quit();
  });

  app.on('activiate', function() {
    return mainWindow || ready();
  });

}).call(this);

//# sourceMappingURL=main.js.map
