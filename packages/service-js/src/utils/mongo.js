const mongoose = require('mongoose');

async function initMongo({ uri }) {
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri);
}

module.exports = {
  initMongo,
};
