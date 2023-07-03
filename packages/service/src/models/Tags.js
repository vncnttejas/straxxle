const { Schema, model } = require('mongoose');
const { mongo: { tagsCollectionName } } = require('../config');

const TagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
});

const Tags = model(tagsCollectionName, TagSchema);

module.exports = {
  TagSchema,
  Tags,
};
