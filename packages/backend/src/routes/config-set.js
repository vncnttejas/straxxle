const handler = async (req) => {
  const { config } = req.body;
  return Config.create(config);
}

module.exports = {
  method: 'POST',
  url: '/config-set',
  handler,
};
