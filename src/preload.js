const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("horseAPI", {
  read: async () => {
    return await ipcRenderer.invoke("read-horse-info");
  },
  write: async (data) => {
    return await ipcRenderer.invoke("write-horse-info", data);
  },
  getColors: async () => {
    return await ipcRenderer.invoke("get-colors");
  },
});
