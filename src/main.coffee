'use strict'

{app, BrowserWindow, ipcMain} = require 'electron'
{autoUpdater} = require 'electron-updater'
url = require 'url'
path = require 'path'
robot = require 'robotjs'

mainWindow = null
ready = ->
  autoUpdater.checkForUpdatesAndNotify()
  mainWindow = new BrowserWindow
    width: 800
    height: 600
  mainWindow.on 'closed', ->
    mainWindow = null
  mainWindow.loadURL url.format
    pathname: path.join __dirname, 'index.html'
    protocol: 'file:'
    slashes: true
  mainWindow.openDevTools()
  mainWindow.webContents.session.setCertificateVerifyProc (req, cb) ->
    console.log 'verify cert', req.hostname
    cb 0
  ipcMain.on 'mousemove', (win, evt) ->
    robot.moveMouse evt.x, evt.y
app.on 'ready', ready
app.on 'window-all-closed', ->
  process.platform is 'darwin' or app.quit()
app.on 'activiate', ->
  mainWindow or ready()