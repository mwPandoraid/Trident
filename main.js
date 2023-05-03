const { app, BrowserWindow } = require('electron')





const createWindow = () => {

    var loadingWindow = new BrowserWindow({
        width:          200,
        height:         200,
        transparent:    (process.platform != 'linux'), // Transparency doesn't work on Linux.
        resizable:      false,
        frame:          false,
        alwaysOnTop:    true,
        hasShadow:      false,
        title:          "Loading..."
    });
    loadingWindow.loadURL('file://' + __dirname + '/close-icon.png');
    
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: false
    })
    win.webContents.once('did-finish-load', function ()
    {
        win.show();
        loadingWindow.close();
    });

    win.loadFile('index.html')
}

app.whenReady().then(() => {

    createWindow()

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})