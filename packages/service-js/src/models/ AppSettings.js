const { Schema, default: mongoose } = require('mongoose');
const { mongo: { configCollectionName } } = require('../config');

const SettingsSchema = new Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  settings: {
    type: Object,
  },
}, {
  timestamps: { createdAt: true, updatedAt: true },
});

const AppSettings = mongoose.model(configCollectionName, SettingsSchema);

module.exports = {
  SettingsSchema,
  AppSettings,
};
