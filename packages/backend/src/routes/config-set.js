const { SettingsSchema } = require('../models/ AppSettings');

const handler = async (req) => {
  const { config } = req.body;
  return SettingsSchema.create(config);
};

module.exports = {
  method: 'POST',
  url: '/config-set',
  handler,
};
