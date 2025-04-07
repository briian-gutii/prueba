const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Configuración para almacenamiento
let settings = {};

// Mantener una referencia global del objeto window
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Cargar el archivo HTML de la aplicación
  mainWindow.loadFile('index.html');

  // Abrir DevTools en desarrollo
  // mainWindow.webContents.openDevTools();

  // Emitido cuando la ventana es cerrada
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // En macOS es común volver a crear una ventana en la aplicación cuando
    // el icono del dock es clickeado y no hay otras ventanas abiertas.
    if (mainWindow === null) createWindow();
  });
});

// Salir cuando todas las ventanas estén cerradas, excepto en macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Obtener lista de impresoras
ipcMain.handle('get-printers', async () => {
  return mainWindow.webContents.getPrinters();
});

// Imprimir contenido
ipcMain.handle('print-content', async (event, options) => {
  const { content, printerName, silent = false } = options;

  // Crear una ventana oculta para imprimir
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Cargar el contenido HTML a imprimir
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);

  try {
    // Configurar opciones de impresión
    const printOptions = {
      silent: silent,
      printBackground: true,
      deviceName: printerName
    };

    // Imprimir
    const data = await printWindow.webContents.print(printOptions);

    // Cerrar la ventana de impresión
    printWindow.close();

    return { success: true, data };
  } catch (error) {
    printWindow.close();
    return { success: false, error: error.message };
  }
});

// Guardar configuración
ipcMain.handle('save-settings', async (event, newSettings) => {
  settings = newSettings;
  return { success: true };
});

// Obtener configuración
ipcMain.handle('get-settings', async () => {
  return settings || {};
});
