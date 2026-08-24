const { contextBridge, ipcRenderer } = require('electron');

/**
 * The only bridge between the page and the machine. Everything exposed here is
 * read-only and returns plain data — the renderer stays sandboxed with no Node
 * access, which matters for a page that also runs in an ordinary browser tab.
 */
contextBridge.exposeInMainWorld('d3vices', {
  isDesktop: true,
  system: () => ipcRenderer.invoke('d3vices:system'),
  displays: () => ipcRenderer.invoke('d3vices:displays'),
  disks: () => ipcRenderer.invoke('d3vices:disks'),
  mediaAccess: (kind) => ipcRenderer.invoke('d3vices:media-access', kind),
  openExternal: (url) => ipcRenderer.invoke('d3vices:open-external', url),
  // The network test must measure a real link, not the loopback server the app
  // is served from, so on the desktop it is pointed at the public endpoints.
  netBase: 'https://d3vices.com',
});
