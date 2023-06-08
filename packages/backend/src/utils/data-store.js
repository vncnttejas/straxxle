let globalDataStore = {};

const upsertDataStore = (update) => {
  globalDataStore = { ...globalDataStore, ...update };
};

const getStoreData = (key) => (key ? globalDataStore[key] : globalDataStore);

module.exports = {
  upsertDataStore,
  getStoreData,
};
