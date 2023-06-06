const handler = async (req) => {
  const { config } = req.body;
  return Config.findOne(config, { sort: { createdAt: -1 } });
}

module.exports = {
  method: 'GET',
  url: '/config-get',
  handler,
};
