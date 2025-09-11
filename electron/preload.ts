console.log('=== PRELOAD SCRIPT LOADING ===');
import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// Create a unique API key just for your prediction function
contextBridge.exposeInMainWorld('ncaaAPI', {
  predictTeams: (teamOne: string, teamTwo: string): Promise<any> => 
    ipcRenderer.invoke('predict-teams', teamOne, teamTwo)
})

// Simple type declaration for the unique API
declare global {
  interface Window {
    ncaaAPI: {
      predictTeams: (teamOne: string, teamTwo: string) => Promise<any>
    }
  }
}

console.log('=== PRELOAD API EXPOSED ===');