const { Orders } = require('../models/Orders');

const handler = async (req) => {
  const { orderId } = req.body.params;
  const { tags } = req.body;
  await Orders.updateOne({ id: orderId }, { tags });
  return {
    success: true,
  };
};

module.exports = {
  method: 'POST',
  url: '/:orderId/update-tags',
  handler,
};