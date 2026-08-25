/* Async IndexedDB save backend exposed for legacy Java/GWT/TeaVM glue code. */
(() => {
  const DB_NAME = 'mindustry-web-save-data';
  const STORE_NAME = 'files';
  const VERSION = 1;

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    });
  }

  async function tx(mode, callback) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = callback(store);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      transaction.oncomplete = () => db.close();
      transaction.onabort = () => reject(transaction.error);
    });
  }

  window.MindustryIDBStorage = {
    get: (key) => tx('readonly', (store) => store.get(key)),
    set: (key, value) => tx('readwrite', (store) => store.put(value, key)),
    remove: (key) => tx('readwrite', (store) => store.delete(key)),
    keys: () => tx('readonly', (store) => store.getAllKeys())
  };
})();
