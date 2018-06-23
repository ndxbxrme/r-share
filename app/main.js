(function() {
  'use strict';
  var BrowserWindow, app, autoUpdater, ipcMain, mainWindow, path, ready, robot, url;

  ({app, BrowserWindow, ipcMain} = require('electron'));

  ({autoUpdater} = require('electron-updater'));

  url = require('url');

  path = require('path');

  robot = require('robotjs');

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
    mainWindow.webContents.session.setCertificateVerifyProc(function(req, cb) {
      console.log('verify cert', req.hostname);
      return cb(0);
    });
    return ipcMain.on('mousemove', function(win, evt) {
      return robot.moveMouse(evt.x, evt.y);
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
