const { Schema, ObjectId, model } = require('mongoose');
const { mongo: { orderLogCollectionName } } = require('../config');
const { Tags } = require('./Tags');

const OrderSchema = new Schema({
  symbol: {
    type: String,
    required: true,
  },
  strike: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  tags: {
    type: [ObjectId],
  },
  txnPrice: {
    type: Number,
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
  expiryDate: {
    type: Date,
    required: true,
  },
  expiryType: {
    type: String,
    required: true,
  },
  index: {
    type: String,
    required: true,
  },
  filledQty: {
    type: Number,
  },
  filledAt: {
    type: Date,
  },
  cancelled: {
    type: Boolean,
  },
  cancelledAt: {
    type: Date,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});
OrderSchema.path('tags').ref(Tags);

const Orders = model(orderLogCollectionName, OrderSchema);

module.exports = {
  OrderSchema,
  Orders,
};
