const { SettingsSchema } = require('../models/ AppSettings');

const handler = async (req) => {
  const { config } = req.body;
  return SettingsSchema.findOne(config, { sort: { createdAt: -1 } });
};

module.exports = {
  method: 'GET',
  url: '/config-get',
  handler,
};
