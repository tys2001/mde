import Dexie from "dexie";

const idb = new Dexie("mdedb");
idb.version(2).stores({
  documents: "name",
  stylesheets: "name",
  documentContents: "name",
  stylesheetContents: "name",
});

export default {
  addImage: async (file) => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  },
  saveDocument: async (title, content) => {
    await idb.documents.put({
      name: title,
      datetime: new Date(),
    });
    await idb.documentContents.put({
      name: title,
      text: content,
    });
  },
  listDocuments: async () => {
    return await idb.documents.toArray();
  },
  getDocument: async (title) => {
    return idb.documentContents.get({ name: title });
  },
  saveStylesheet: async (title, content) => {
    await idb.stylesheets.put({
      name: title,
      datetime: new Date(),
    });
    await idb.stylesheetContents.put({
      name: title,
      text: content,
    });
  },
  listStylesheets: async () => {
    return await idb.stylesheets.toArray();
  },
  getStylesheet: async (title) => {
    return idb.stylesheetContents.get({ name: title });
  }
}