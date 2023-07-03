const { Schema, default: mongoose } = require('mongoose');
const { mongo: { tickCollectionName } } = require('../config');

const TickSnapshotSchema = new Schema({
  snapshot: {
    type: Object,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

const TickSnapshot = mongoose.model(tickCollectionName, TickSnapshotSchema);

module.exports = {
  TickSnapshotSchema,
  TickSnapshot,
};
