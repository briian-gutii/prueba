const { contextBridge, ipcRenderer } = require('electron');

// Exponer funciones protegidas a la ventana del navegador
contextBridge.exposeInMainWorld('electronAPI', {
  // Obtener lista de impresoras
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  
  // Imprimir contenido
  printContent: (options) => ipcRenderer.invoke('print-content', options),
  
  // Guardar configuración
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Obtener configuración
  getSettings: () => ipcRenderer.invoke('get-settings')
});
