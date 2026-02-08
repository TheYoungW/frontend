const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('synria', {
  platform: process.platform,
})
