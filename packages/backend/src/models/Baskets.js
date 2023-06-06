const { Schema, ObjectId, model } = require('mongoose');
const { mongo: { basketCollectionName } } = require('../config');
const { Tags } = require('./Tags');

const BasketOrderSchema = new Schema({
  symbol: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  orderType: {
    type: String,
    required: true,
    enum: ['BUY', 'SELL'],
  },
  tags: {
    type: [ObjectId],
  },
  buyPrice: {
    type: Number,
    required: true,
  },
  strikeType: {
    type: String,
    required: true,
  },
  contractType: {
    type: String,
    required: true,
  },
  tt: {
    type: Number,
    required: true,
  },
  exchange: {
    type: String,
    required: true,
  },
});

BasketOrderSchema.path('tags').ref(Tags);

const BasketSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tags: {
    type: [ObjectId],
  },
  orders: {
    type: [BasketOrderSchema],
  },
}, {
  timestamps: { createdAt: true, updatedAt: true },
});

BasketSchema.path('tags').ref(Tags);

const Baskets = model(basketCollectionName, BasketSchema);

module.exports = {
  BasketSchema,
  Baskets,
};
